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

    @Volatile var isConnected: Boolean = false // 是否已连接
        private set

    var onConnectionChanged: ((connected: Boolean) -> Unit)? = null // 连接状态变化
    var onDeviceChanged: ((devices: List<LanDevice>) -> Unit)? = null // 设备列表变化
    var onMessageReceived: ((frame: FrameData, fromIp: String) -> Unit)? = null // 收到消息（JSON / Raw 帧）

    /**
     * 连接
     */
    fun connect(context: Context) {
        if (isConnected) return

        networkMonitor.start(context) { available ->
            if (available) doConnect() else doDisconnect()
        }
    }

    /**
     * 断开连接
     */
    fun disconnect(context: Context) {
        networkMonitor.stop(context)
        doDisconnect()
    }

    /**
     * 发送帧数据
     *
     * @param type     帧类型（ClientConfig.Type.*）
     * @param payload  负载字节
     * @param targetIp 目标 IP，null 表示广播
     * @param ordered  是否有序（仅单播有效，有序即需 Ack）
     */
    fun send(
        type: Byte,
        payload: ByteArray,
        targetIp: String? = null,
        ordered: Boolean = true,
    ): Boolean {
        if (!isConnected) {
            Log.w(TAG, "send: not connected")
            return false
        }

        return if (targetIp != null) {
            sendUnicast(type, payload, targetIp, ordered)
        } else {
            sendBroadcast(type, payload)
        }
    }

    val devices: List<LanDevice> get() = deviceRegistry.getAll() // 全部设备列表
    val onlineDevices: List<LanDevice> get() = deviceRegistry.getOnline() // 在线设备列表

    /**
     * 执行连接
     */
    @Synchronized
    private fun doConnect() {
        if (isConnected) return
        if (!socketManager.create()) {
            Log.e(TAG, "Failed to create socket")
            return
        }

        receiver.onFrameReceived = { frame, fromIp ->
            messageRouter.dispatch(frame, fromIp)
        }
        receiver.start()

        deviceRegistry.onDeviceChanged = {
            onDeviceChanged?.invoke(deviceRegistry.getAll())
        }

        messageRouter.onMessageListener = { frame, fromIp ->
            onMessageReceived?.invoke(frame, fromIp)
        }

        heartbeatEngine.start()
        discoverDevices()

        isConnected = true
        onConnectionChanged?.invoke(true)
        Log.i(TAG, "Connected")
    }

    /**
     * 执行断开
     */
    @Synchronized
    private fun doDisconnect() {
        if (!isConnected) return
        sendBroadcast(ClientConfig.Type.OFFLINE, ByteArray(0))

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
     */
    private fun sendBroadcast(type: Byte, payload: ByteArray): Boolean {
        val frame = FrameCodec.encode(
            type = type,
            seqNum = 0,
            flags = ClientConfig.Flags.NONE,
            payload = payload,
        )
        return socketManager.sendBroadcast(frame)
    }

    /**
     * 通过单播发送帧
     */
    private fun sendUnicast(
        type: Byte,
        payload: ByteArray,
        targetIp: String,
        ordered: Boolean,
    ): Boolean {
        val hostId = ClientConfig.hostId(targetIp)
        val seqNum = if (ordered) seqManager.nextSendSeq(hostId) else 0
        val flags = if (ordered) ClientConfig.Flags.ORDERED else ClientConfig.Flags.NONE

        val frame = FrameCodec.encode(
            type = type,
            seqNum = seqNum,
            flags = flags,
            payload = payload,
        )

        val sent = socketManager.sendUnicast(frame, targetIp)
        if (sent && ordered) {
            ackEngine.register(hostId, seqNum, frame, targetIp)
        }
        return sent
    }

    /**
     * 广播心跳帧
     */
    private fun sendHeartbeat() {
        val frame = FrameCodec.encode(
            type = ClientConfig.Type.HEARTBEAT,
            seqNum = 0,
            flags = ClientConfig.Flags.NONE,
            payload = ByteArray(0),
        )
        socketManager.sendBroadcast(frame)
    }

    /**
     * 主动广播设备发现
     */
    private fun discoverDevices() {
        val payload = buildLocalDevicePayload()
        val frame = FrameCodec.encode(
            type = ClientConfig.Type.CALL,
            seqNum = 0,
            flags = ClientConfig.Flags.NONE,
            payload = payload,
        )
        socketManager.sendBroadcast(frame)
        Log.i(TAG, "Device discovery broadcast sent")
    }
}
