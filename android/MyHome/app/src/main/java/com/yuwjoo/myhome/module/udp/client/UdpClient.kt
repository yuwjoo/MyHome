package com.yuwjoo.myhome.module.udp.client

import android.content.Context
import android.util.Log

/**
 * UDP 客户端
 */
class UdpClient {
    companion object {
        private const val TAG = "UdpClient"
    }

    private val socketManager = SocketManager() // Socket 管理器
    private val receiver = Receiver(socketManager) // 接收器
    private val deviceRegistry = DeviceRegistry() // 设备注册表
    private val seqManager = SeqManager() // 序号管理器
    private val retryPolicy = RetryPolicy() // 重试策略
    private val ackEngine = AckEngine(
        retryPolicy = retryPolicy,
        onRetry = { ip, rawFrame -> socketManager.sendUnicast(rawFrame, ip) },
    ) // ACK 引擎
    private val messageRouter = MessageRouter(
        socketManager = socketManager,
        deviceRegistry = deviceRegistry,
        ackEngine = ackEngine,
        seqManager = seqManager,
    ) // 消息路由器
    private val heartbeatEngine = HeartbeatEngine(
        onSendHeartbeat = { sendHeartbeat() },
        onDetectOffline = { deviceRegistry.detectOffline() },
    ) // 心跳引擎
    private val networkMonitor = NetworkMonitor() // 网络监听器

    // 状态
    @Volatile var isConnected: Boolean = false // 是否已连接
        private set

    var onConnectionChanged: ((connected: Boolean) -> Unit)? = null // 连接状态变化
    var onDeviceChanged: ((devices: List<LanDevice>) -> Unit)? = null // 设备列表变化
    var onMessageReceived: ((frame: FrameData, fromIp: String) -> Unit)? = null // 收到消息（JSON / Raw 帧）

    /**
     * 连接
     *
     * @param context 上下文
     */
    fun connect(context: Context) {
        if (isConnected) return

        // 网络监听
        networkMonitor.start(context) { available ->
            if (available) {
                if (!isConnected) doConnect()
            } else {
                if (isConnected) doDisconnect()
            }
        }
    }

    /**
     * 断开连接
     *
     * @param context 上下文（用于注销网络监听）
     */
    fun disconnect(context: Context) {
        networkMonitor.stop(context)
        doDisconnect()
    }

    /**
     * 发送帧数据
     *
     * @param type      帧类型（UdpConfig.Type.*）
     * @param payload   负载字节
     * @param targetIp  目标 IP，null 表示广播
     * @param ordered   是否有序（仅单播有效）
     * @param needAck   是否需要 ACK 确认（仅单播有效）
     * @return 是否发送成功（或已排队）
     */
    fun send(
        type: Byte,
        payload: ByteArray,
        targetIp: String? = null,
        ordered: Boolean = true,
        needAck: Boolean = true,
    ): Boolean {
        if (!isConnected) {
            Log.w(TAG, "send: not connected")
            return false
        }

        return if (targetIp != null) {
            // 单播：支持序号 + ACK
            sendUnicast(type, payload, targetIp, ordered, needAck)
        } else {
            // 广播：无序号 / 无 ACK
            sendBroadcast(type, payload)
        }
    }

    /**
     * 获取全部设备列表
     *
     * @return 设备列表
     */
    val devices: List<LanDevice> get() = deviceRegistry.getAll()

    /**
     * 获取在线设备列表（仅在线）
     *
     * @return 在线设备列表
     */
    val onlineDevices: List<LanDevice> get() = deviceRegistry.getOnline()

    /**
     * 执行连接：创建 Socket、启动接收/设备注册/消息路由/心跳，并广播设备发现
     */
    private fun doConnect() {
        if (!socketManager.create()) {
            Log.e(TAG, "Failed to create socket")
            return
        }

        // 接收 → 路由
        receiver.onFrameReceived = { frame, fromIp ->
            messageRouter.dispatch(frame, fromIp)
        }
        receiver.start()

        // 设备变更 → 外部
        deviceRegistry.onDeviceChanged = {
            onDeviceChanged?.invoke(deviceRegistry.getAll())
        }

        // 消息 → 外部
        messageRouter.onMessageListener = { frame, fromIp ->
            onMessageReceived?.invoke(frame, fromIp)
        }

        // 心跳
        heartbeatEngine.start()

        // 初始设备发现广播（主动 CALL 通告，避免等待被动心跳）
        discoverDevices()

        isConnected = true
        onConnectionChanged?.invoke(true)
        Log.i(TAG, "Connected")
    }

    /**
     * 执行断开：广播离线帧 → 停止心跳/接收/ACK → 销毁 Socket → 重置序号与设备表
     */
    private fun doDisconnect() {
        // 广播离线通知，让其他设备立即知晓本机离网
        sendBroadcast(UdpConfig.Type.OFFLINE, ByteArray(0))

        heartbeatEngine.stop()
        receiver.stop()
        ackEngine.stop()
        socketManager.destroy()
        seqManager.reset()
        deviceRegistry.clear()

        isConnected = false
        onConnectionChanged?.invoke(false)
        Log.i(TAG, "Disconnected")
    }

    /**
     * 通过广播发送帧（无序号、无 ACK）
     *
     * @param type    帧类型
     * @param payload 负载数据
     * @return 是否发送成功
     */
    private fun sendBroadcast(type: Byte, payload: ByteArray): Boolean {
        val frame = FrameCodec.encode(
            type = type,
            seqNum = 0,
            flags = UdpConfig.Flags.NONE,
            payload = payload,
        )
        return socketManager.sendBroadcast(frame)
    }

    /**
     * 通过单播发送帧（支持序号与 ACK）
     *
     * @param type     帧类型
     * @param payload  负载数据
     * @param targetIp 目标设备 IP
     * @param ordered  是否携带序号
     * @param needAck  是否需要 ACK 确认
     * @return 是否发送成功
     */
    private fun sendUnicast(
        type: Byte,
        payload: ByteArray,
        targetIp: String,
        ordered: Boolean,
        needAck: Boolean,
    ): Boolean {
        val seqNum = if (ordered) seqManager.nextSendSeq(targetIp) else 0
        var flags = UdpConfig.Flags.NONE
        if (needAck) flags = (flags.toInt() or UdpConfig.Flags.NEED_ACK.toInt()).toByte()
        if (ordered) flags = (flags.toInt() or UdpConfig.Flags.ORDERED.toInt()).toByte()

        val frame = FrameCodec.encode(
            type = type,
            seqNum = seqNum,
            flags = flags,
            payload = payload,
        )

        val sent = socketManager.sendUnicast(frame, targetIp)
        if (sent && needAck) {
            ackEngine.register(targetIp, seqNum, frame)
        }
        return sent
    }

    /**
     * 广播心跳帧，通告自身在线状态
     */
    private fun sendHeartbeat() {
        val frame = FrameCodec.encode(
            type = UdpConfig.Type.HEARTBEAT,
            seqNum = 0,
            flags = UdpConfig.Flags.NONE,
            payload = ByteArray(0),
        )
        socketManager.sendBroadcast(frame)
    }

    /**
     * 主动广播设备发现请求（CALL），让网络中已有设备回复 ANSWER
     */
    private fun discoverDevices() {
        val payload = buildLocalDevicePayload()
        val frame = FrameCodec.encode(
            type = UdpConfig.Type.CALL,
            seqNum = 0,
            flags = UdpConfig.Flags.NONE,
            payload = payload,
        )
        socketManager.sendBroadcast(frame)
        Log.i(TAG, "Device discovery broadcast sent")
    }
}
