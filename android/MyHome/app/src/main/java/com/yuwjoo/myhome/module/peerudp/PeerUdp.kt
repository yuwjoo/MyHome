package com.yuwjoo.myhome.module.peerudp

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.peerudp.SerialCoroutine
import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig
import com.yuwjoo.myhome.module.peerudp.device.LanDeviceManager
import com.yuwjoo.myhome.module.peerudp.device.SendResult
import com.yuwjoo.myhome.module.peerudp.frame.AckPayload
import com.yuwjoo.myhome.module.peerudp.frame.DeviceInfoPayload
import com.yuwjoo.myhome.module.peerudp.frame.fromBytes
import com.yuwjoo.myhome.module.peerudp.frame.toBytes
import com.yuwjoo.myhome.module.peerudp.topic.TopicListenerManager
import com.yuwjoo.myhome.module.peerudp.topic.topicMessageToJson
import com.yuwjoo.myhome.module.peerudp.transport.NetworkMonitor
import com.yuwjoo.myhome.module.peerudp.transport.Transport
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * P2P UDP 通信
 */
object PeerUdp {

    private const val TAG = "PeerUdp"

    private val transport = Transport() // udp传输器
    private val deviceManager = LanDeviceManager(transport) // 设备管理器
    private val topicListenerManager = TopicListenerManager(transport, deviceManager) // 主题监听管理器
    private lateinit var networkMonitor: NetworkMonitor // 网络监听器

    var isConnected: Boolean = false // 当前连接状态
        private set

    private val connectionListeners = mutableListOf<(connected: Boolean) -> Unit>() // 连接状态变化监听器集合

    init {
        // 传输器打开状态改变
        transport.onOpenChanged = { opened ->
            isConnected = opened
            connectionListeners.forEach { it(opened) }
        }

        // 心跳消息
        transport.registerFrameListener(FrameConfig.Type.HEARTBEAT) { _, fromIp ->
            val device = deviceManager.getDevice(fromIp)
            if (device != null) {
                device.heartbeat()
            } else {
                sendDeviceInfoFrame(FrameConfig.Type.CALL, fromIp)
            }
        }
        // 呼叫消息
        transport.registerFrameListener(FrameConfig.Type.CALL) { frame, fromIp ->
            DeviceInfoPayload.fromBytes(frame.payload)?.let { info ->
                deviceManager.addDevice(
                    fromIp,
                    info.deviceName,
                    info.abilities,
                    info.heartbeatInterval,
                    info.heartbeatTimeout,
                )
            }
            sendDeviceInfoFrame(FrameConfig.Type.ANSWER, fromIp)
        }
        // 应答消息
        transport.registerFrameListener(FrameConfig.Type.ANSWER) { frame, fromIp ->
            DeviceInfoPayload.fromBytes(frame.payload)?.let { info ->
                deviceManager.addDevice(
                    fromIp,
                    info.deviceName,
                    info.abilities,
                    info.heartbeatInterval,
                    info.heartbeatTimeout,
                )
            }
        }
        // 确认消息
        transport.registerFrameListener(FrameConfig.Type.ACK) { frame, fromIp ->
            val (seq, recvSeq) = AckPayload.fromBytes(frame.payload) ?: return@registerFrameListener
            deviceManager.getDevice(fromIp)?.ackMessage(seq, recvSeq)
        }
        // JSON消息
        transport.registerFrameListener(FrameConfig.Type.JSON) { frame, fromIp ->
            topicListenerManager.handleJsonFrame(frame, fromIp)
        }
        // 离线消息
        transport.registerFrameListener(FrameConfig.Type.OFFLINE) { _, fromIp ->
            deviceManager.removeDevice(fromIp)
        }
    }

    /**
     * 初始化（使用前必先调用，在串行调度器中执行，与 connect/disconnect 天然串行）
     *
     * @param context 当前上下文
     */
    suspend fun init(context: Context) = withContext(SerialCoroutine.dispatcher) {
        if (::networkMonitor.isInitialized) return@withContext
        networkMonitor = NetworkMonitor(context.applicationContext)
    }

    /**
     * 建立 UDP 通信
     */
    suspend fun connect() = withContext(SerialCoroutine.dispatcher) {
        if (isConnected) return@withContext

        // 启动网络监听：网络可用时打开 Transport，断开时关闭
        networkMonitor.start { available ->
            if (available) {
                transport.open()
            } else {
                transport.close()
            }
        }
        // 监听器只响应网络变化，初始按可用处理，主动打开一次
        transport.open()
        Log.i(TAG, "Connected")
    }

    /**
     * 断开 UDP 通信
     */
    suspend fun disconnect() = withContext(SerialCoroutine.dispatcher) {
        if (!isConnected) return@withContext
        networkMonitor.stop()
        transport.close()
        Log.i(TAG, "Disconnected")
    }

    /**
     * 发送数据（按帧协议编码后发送）
     *
     * @param payload    待发送负载（帧 Payload，如 JSON 字节）
     * @param targetIp   目标 IP，为 null 时广播发送（SeqNum 固定为 0，无序）
     * @param onDone 发送完成回调（仅单播有序时触发，参数为发送状态，可省略）
     */
    suspend fun send(
        payload: ByteArray,
        targetIp: String? = null,
        onDone: (status: SendResult) -> Unit = {},
    ): Boolean =
        withContext(SerialCoroutine.dispatcher) {
            if (!isConnected) {
                Log.w(TAG, "send: not connected")
                return@withContext false
            }
            if (targetIp != null) {
                // 单播：通过设备对象发送有序消息（加入消息队列，带重试）
                val device = deviceManager.getDevice(targetIp)
                if (device == null) {
                    Log.w(TAG, "send: device $targetIp not found")
                    return@withContext false
                }
                device.sendOrderedMessage(payload, onDone = onDone)
                true
            } else {
                // 广播：固定 JSON 无序消息，SeqNum 固定为 0
                transport.sendFrame(FrameConfig.Type.JSON, payload, null, null)
            }
    }

    /**
     * 订阅主题
     *
     * @param topic    主题名称
     * @param callback 消息到达时的回调
     */
    fun subscribe(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        topicListenerManager.registerListener(topic, callback)
    }

    /**
     * 取消订阅主题
     *
     * @param topic    主题名称
     * @param callback 待移除的回调
     */
    fun unsubscribe(topic: String, callback: (topic: String, payload: JSONObject?) -> Unit) {
        topicListenerManager.unregisterListener(topic, callback)
    }

    /**
     * 发布主题消息
     *
     * @param topic           主题名称
     * @param payload         负载数据
     * @param targetIp        目标 IP，为 null 时广播
     * @param ordered         是否有序发送（有序 = ACK + 重试）
     * @param onlySubscribers 为 true 时仅向匹配该主题能力的在线设备发送
     * @param onDone          发送完成回调（仅单播有序时触发，参数为发送状态）
     */
    fun publish(
        topic: String,
        payload: JSONObject,
        targetIp: String? = null,
        ordered: Boolean = true,
        onlySubscribers: Boolean = false,
        onDone: (status: SendResult) -> Unit = {},
    ) {
        val bytes = topicMessageToJson(topic, payload).toString().toByteArray(Charsets.UTF_8)
        when {
            targetIp != null -> {
                val device = deviceManager.getDevice(targetIp)
                if (device == null) {
                    Log.w(TAG, "publish: device $targetIp not found")
                    onDone(SendResult.FAILED)
                    return
                }
                if (ordered) {
                    device.sendOrderedMessage(bytes, onDone = onDone)
                } else {
                    device.sendUnorderedMessage(bytes)
                }
            }
            onlySubscribers -> {
                val matched = deviceManager.onlineDeviceList.filter { device ->
                    device.hasTopic(topic)
                }
                if (matched.isEmpty()) {
                    Log.w(TAG, "publish: no subscribers for topic $topic")
                }
                for (device in matched) {
                    if (ordered) {
                        device.sendOrderedMessage(bytes)
                    } else {
                        device.sendUnorderedMessage(bytes)
                    }
                }
                onDone(SendResult.SUCCESS)
            }
            else -> {
                // 广播：无序消息，SeqNum 固定为 0
                transport.sendFrame(FrameConfig.Type.JSON, bytes, null, null)
                onDone(SendResult.SUCCESS)
            }
        }
    }

    /**
     * 注册连接状态变化监听器
     *
     * @param callback 连接状态变化时的回调（参数为是否已连接）
     */
    fun registerConnectionListener(callback: (connected: Boolean) -> Unit) {
        connectionListeners.add(callback)
    }

    /**
     * 取消注册连接状态变化监听器
     *
     * @param callback 待移除的回调
     */
    fun unregisterConnectionListener(callback: (connected: Boolean) -> Unit) {
        connectionListeners.remove(callback)
    }

    /**
     * 发送携带本机设备信息的帧（主动呼叫或应答对端）
     *
     * @param type     帧类型（CALL / ANSWER）
     * @param targetIp 目标 IP
     */
    private fun sendDeviceInfoFrame(type: Byte, targetIp: String) {
        transport.sendFrame(
            type,
            DeviceInfoPayload(
                deviceName = DeviceConfig.Local.DEVICE_NAME,
                abilities = DeviceConfig.Local.DEVICE_ABILITIES,
                heartbeatInterval = DeviceConfig.Local.HEARTBEAT_INTERVAL_MS,
                heartbeatTimeout = DeviceConfig.Local.HEARTBEAT_TIMEOUT_MS,
            ).toBytes(),
            null,
            targetIp,
        )
    }
}
