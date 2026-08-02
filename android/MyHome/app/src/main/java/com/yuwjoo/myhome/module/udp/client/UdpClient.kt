package com.yuwjoo.myhome.module.udp.client

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.udp.client.codec.FrameCodec
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import com.yuwjoo.myhome.module.udp.client.config.NetConfig
import com.yuwjoo.myhome.module.udp.client.device.DeviceRegistry
import com.yuwjoo.myhome.module.udp.client.model.RetryPolicy
import com.yuwjoo.myhome.module.udp.client.device.SeqManager
import com.yuwjoo.myhome.module.udp.client.engine.AckEngine
import com.yuwjoo.myhome.module.udp.client.engine.HeartbeatEngine
import com.yuwjoo.myhome.module.udp.client.model.FrameData
import com.yuwjoo.myhome.module.udp.client.model.LanDevice
import com.yuwjoo.myhome.module.udp.client.router.AckHandler
import com.yuwjoo.myhome.module.udp.client.router.HandshakeHandler
import com.yuwjoo.myhome.module.udp.client.router.HeartbeatHandler
import com.yuwjoo.myhome.module.udp.client.router.MessageRouter
import com.yuwjoo.myhome.module.udp.client.router.OfflineHandler
import com.yuwjoo.myhome.module.udp.client.router.OrderedMsgHandler
import com.yuwjoo.myhome.module.udp.client.transport.NetworkMonitor
import com.yuwjoo.myhome.module.udp.client.transport.UdpSocket

/**
 * UDP 客户端
 */
class UdpClient {
    companion object {
        private const val TAG = "UdpClient"
    }

    private val deviceRegistry = DeviceRegistry() // 设备注册表
    private val seqManager = SeqManager() // 序列号管理器

    private val socket = UdpSocket() // UDP Socket
    private val ackEngine = AckEngine(seqManager, RetryPolicy(), socket) // ACK 确认引擎
    private val heartbeatEngine = HeartbeatEngine(deviceRegistry, socket) // 心跳引擎

    private val heartbeatHandler = HeartbeatHandler(deviceRegistry, heartbeatEngine, seqManager, socket) // 心跳消息处理器
    private val handshakeHandler = HandshakeHandler(deviceRegistry, seqManager, socket, heartbeatEngine) // 握手消息处理器
    private val offlineHandler = OfflineHandler(deviceRegistry) // 离线消息处理器
    private val ackHandler = AckHandler(ackEngine) // ACK 消息处理器
    private val orderedMsgHandler = OrderedMsgHandler(seqManager, socket) // 有序消息处理器
    private val router = MessageRouter( // 消息路由器
        heartbeatHandler,
        handshakeHandler,
        offlineHandler,
        ackHandler,
        orderedMsgHandler,
    )

    private var networkMonitor: NetworkMonitor? = null // 网络监听器

    @Volatile var isConnected: Boolean = false // 是否已连接
        private set

    var onConnectionChanged: ((Boolean) -> Unit)? = null // 连接状态变化回调
    var onDeviceChanged: ((List<LanDevice>) -> Unit)? = null // 设备列表变化回调
    var onMessageReceived: ((FrameData, String, Boolean) -> Unit)? = null // 消息接收回调（isJson 标识是否为 JSON 帧）

    val devices: List<LanDevice> get() = deviceRegistry.getAll() // 所有设备列表
    val onlineDevices: List<LanDevice> get() = deviceRegistry.getOnline() // 在线设备列表

    init {
        deviceRegistry.onDeviceOffline = { ip -> // 设备离线回调
            ackEngine.abort(NetConfig.hostId(ip))
        }

        deviceRegistry.onDeviceChanged = { // 设备列表变更回调
            onDeviceChanged?.invoke(deviceRegistry.getAll())
        }

        socket.onFrameReceived = { frame, fromIp -> // 收到帧回调，统一交路由分发
            router.dispatch(frame, fromIp)
        }

        orderedMsgHandler.onMessageListener = { frame, fromIp, isJson -> // 消息回调，透传给上层
            onMessageReceived?.invoke(frame, fromIp, isJson)
        }
    }

    /**
     * 建立 UDP 连接，启动网络监听
     *
     * @param context 用于注册网络变化监听的 Context
     */
    @Synchronized
    fun connect(context: Context) {
        if (isConnected) return
        val monitor = NetworkMonitor { available ->
            if (available) doConnect() else doDisconnect()
        }
        networkMonitor = monitor
        monitor.start(context)
    }

    /**
     * 断开 UDP 连接，停止网络监听并清理资源
     */
    @Synchronized
    fun disconnect() {
        if (!isConnected) return
        networkMonitor?.stop()
        networkMonitor = null
        doDisconnect()
    }

    /**
     * 发送帧数据，根据 targetIp 决定单播或广播
     *
     * @param type 帧类型（HEARTBEAT / OFFLINE / JSON / RAW）
     * @param payload 帧负载数据
     * @param targetIp 目标 IP，为 null 时广播
     * @param ordered 是否需要有序发送（ACK 确认）
     * @return 是否发送成功
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
     * 建立连接，创建 Socket 并启动心跳引擎
     *
     * @return 是否连接成功
     */
    private fun doConnect(): Boolean {
        if (!socket.create()) return false
        heartbeatEngine.start()
        isConnected = true
        onConnectionChanged?.invoke(true)
        Log.i(TAG, "Connected")
        return true
    }

    /**
     * 断开连接，发送离线通知并清理所有引擎和 Socket 资源
     */
    private fun doDisconnect() {
        sendBroadcast(FrameConfig.Type.OFFLINE, ByteArray(0))
        heartbeatEngine.stop()
        ackEngine.stop()
        socket.destroy()
        seqManager.reset()
        isConnected = false
        onConnectionChanged?.invoke(false)
        Log.i(TAG, "Disconnected")
    }

    /**
     * 广播帧数据
     *
     * @param type 帧类型
     * @param payload 帧负载数据
     * @return 是否发送成功
     */
    private fun sendBroadcast(type: Byte, payload: ByteArray): Boolean {
        val frame = FrameCodec.encode(type, 0, FrameConfig.Flags.NONE, payload)
        return socket.sendBroadcast(frame)
    }

    /**
     * 单播帧数据，支持有序/无序模式
     *
     * @param type 帧类型
     * @param payload 帧负载数据
     * @param targetIp 目标 IP
     * @param ordered 是否需要 ACK 确认的有序发送
     * @return 是否发送成功
     */
    private fun sendUnicast(
        type: Byte,
        payload: ByteArray,
        targetIp: String,
        ordered: Boolean,
    ): Boolean {
        if (ordered) {
            val hostId = NetConfig.hostId(targetIp)
            ackEngine.enqueue(hostId, targetIp) { seqNum ->
                FrameCodec.encode(type, seqNum, FrameConfig.Flags.ORDERED, payload)
            }
            return true
        }
        val frame = FrameCodec.encode(type, 0, FrameConfig.Flags.NONE, payload)
        return socket.sendUnicast(frame, targetIp)
    }
}
