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

    private val udpSocket = UdpSocket() // UDP Socket（含内部 SocketReader）
    private val deviceRegistry = DeviceRegistry() // 设备注册表
    private val seqManager = SeqManager() // 序号管理器
    private val ackEngine = AckEngine(
        seqManager = seqManager,
        retryPolicy = RetryPolicy(),
        udpSocket = udpSocket,
    ) // ACK 引擎
    private val heartbeatEngine = HeartbeatEngine(
        deviceRegistry,
        udpSocket,
    ) // 心跳引擎
    private val messageRouter = MessageRouter(
        udpSocket,
        deviceRegistry,
        ackEngine,
        seqManager,
        heartbeatEngine,
    ) // 消息路由器
    private val networkMonitor = NetworkMonitor { available ->
        if (available) doConnect() else doDisconnect()
    } // 网络监听器

    init {
        // 设备离线时中止对应主机的 ACK 重试
        deviceRegistry.onDeviceOffline = { ip -> ackEngine.abort(ClientConfig.hostId(ip)) }
    }

    @Volatile var isConnected: Boolean = false // 是否已连接
        private set

    var onConnectionChanged: ((connected: Boolean) -> Unit)? = null // 连接状态变化
    var onDeviceChanged: ((devices: List<LanDevice>) -> Unit)? = null // 设备列表变化
    var onMessageReceived: ((frame: FrameData, fromIp: String) -> Unit)? = null // 收到消息（JSON / Raw 帧）

    val devices: List<LanDevice> get() = deviceRegistry.getAll() // 全部设备列表
    val onlineDevices: List<LanDevice> get() = deviceRegistry.getOnline() // 在线设备列表

    /**
     * 连接
     */
    @Synchronized
    fun connect(context: Context) {
        if (isConnected) return

        networkMonitor.start(context)
    }

    /**
     * 断开连接
     */
    @Synchronized
    fun disconnect(context: Context) {
        if (!isConnected) return
        
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

    /**
     * 执行连接
     */
    @Synchronized
    private fun doConnect() {
        if (isConnected) return
        if (!udpSocket.create()) {
            Log.e(TAG, "Failed to create socket")
            return
        }

        udpSocket.onFrameReceived = { frame, fromIp ->
            messageRouter.dispatch(frame, fromIp)
        }

        deviceRegistry.onDeviceChanged = {
            onDeviceChanged?.invoke(deviceRegistry.getAll())
        }

        messageRouter.onMessageListener = { frame, fromIp ->
            onMessageReceived?.invoke(frame, fromIp)
        }

        heartbeatEngine.start()

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
        ackEngine.stop()
        udpSocket.destroy()
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
        return udpSocket.sendBroadcast(frame)
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
        val flags = if (ordered) ClientConfig.Flags.ORDERED else ClientConfig.Flags.NONE

        if (ordered) {
            val hostId = ClientConfig.hostId(targetIp)
            ackEngine.enqueue(
                hostId = hostId,
                targetIp = targetIp,
                buildFrame = { seqNum ->
                    FrameCodec.encode(type, seqNum, flags, payload)
                },
            )
            return true
        }

        val frame = FrameCodec.encode(type, 0, flags, payload)
        return udpSocket.sendUnicast(frame, targetIp)
    }

}
