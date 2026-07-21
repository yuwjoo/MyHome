package com.yuwjoo.myhome.module.udp

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.common.ListenerRegistry
import com.yuwjoo.myhome.module.udp.client.ClientConfig
import com.yuwjoo.myhome.module.udp.client.FrameData
import com.yuwjoo.myhome.module.udp.client.UdpClient
import com.yuwjoo.myhome.module.udp.listener.ConnectionListener
import com.yuwjoo.myhome.module.udp.listener.DeviceListener
import com.yuwjoo.myhome.module.udp.listener.TopicListener
import com.yuwjoo.myhome.module.udp.model.LanDevice
import com.yuwjoo.myhome.module.udp.model.TopicMessage
import org.json.JSONObject

/**
 * UDP 管理器 — 单例入口，对接 client.UdpClient
 *
 * @FileName UdpManager.kt
 * @FilePath com/yuwjoo/myhome/module/udp/UdpManager.kt
 * @Author yuwjoo
 * @Date 2025-01-01
 */
object UdpManager {

    private const val TAG = "UdpManager"

    private val client = UdpClient()
    private val topicManager = TopicManager()
    private val connectionListeners = ListenerRegistry<Unit, ConnectionListener>()
    private val deviceListeners = ListenerRegistry<Unit, DeviceListener>()

    @Volatile
    private var _isConnected = false

    // ──────────────── 状态访问 ────────────────

    /** 是否已连接 */
    val isConnected: Boolean get() = _isConnected

    /** 设备列表（已转为 model.LanDevice） */
    val deviceList: List<LanDevice>
        get() = client.devices.map { it.toModelDevice() }

    /** 在线设备列表（已转为 model.LanDevice） */
    val onlineDeviceList: List<LanDevice>
        get() = client.onlineDevices.map { it.toModelDevice() }

    // ──────────────── 连接/断开 ────────────────

    /**
     * 启动 UDP 通信
     *
     * @param context Android Context（用于网络监听注册）
     */
    fun connect(context: Context) {
        if (_isConnected) return
        // _isConnected 由 onConnectionChanged 回调在 socket 实际就绪后设置，
        // 避免在此提前置 true 导致状态与实际连接不一致

        // 设备变更 → 通知所有 DeviceListener
        client.onDeviceChanged = { _ ->
            val modelDevices = client.devices.map { it.toModelDevice() }
            deviceListeners.dispatch(Unit) { it.onDeviceChanged(modelDevices) }
        }

        // 连接状态变更 → 通知所有 ConnectionListener
        client.onConnectionChanged = { connected ->
            _isConnected = connected
            connectionListeners.dispatch(Unit) { it.onConnectionChanged(connected) }
        }

        // 收到消息 → 解析 JSON 并分发到主题监听器
        client.onMessageReceived = { frame, fromIp ->
            handleIncomingMessage(frame, fromIp)
        }

        client.connect(context)
    }

    /**
     * 停止 UDP 通信
     *
     * @param context Android Context（用于网络监听注销）
     */
    fun disconnect(context: Context) {
        client.disconnect(context)
        _isConnected = false
    }

    // ──────────────── 设备监听 ────────────────

    fun registerDeviceListener(listener: DeviceListener) {
        deviceListeners.register(Unit, listener)
    }

    fun unregisterDeviceListener(listener: DeviceListener) {
        deviceListeners.unregister(Unit, listener)
    }

    // ──────────────── 连接状态监听 ────────────────

    fun registerConnectionListener(listener: ConnectionListener) {
        connectionListeners.register(Unit, listener)
    }

    fun unregisterConnectionListener(listener: ConnectionListener) {
        connectionListeners.unregister(Unit, listener)
    }

    // ──────────────── 主题订阅/发布 ────────────────

    /**
     * 订阅主题
     */
    fun subscribe(topic: String, callback: TopicListener) {
        topicManager.registerListener(topic, callback)
    }

    /**
     * 取消订阅主题
     */
    fun unsubscribe(topic: String, callback: TopicListener) {
        topicManager.unregisterListener(topic, callback)
    }

    /**
     * 发布主题消息
     *
     * @param topic           主题名称
     * @param payload         负载数据
     * @param targetIp        目标 IP（null = 广播）
     * @param ordered         是否有序发送（有序 = ACK + 重试）
     * @param onlySubscribers 为 true 时仅向匹配该主题能力的在线设备发送
     */
    fun publish(
        topic: String,
        payload: JSONObject,
        targetIp: String? = null,
        ordered: Boolean = true,
        onlySubscribers: Boolean = false,
    ) {
        val bytes = TopicMessage.toBytes(topic, payload)
        when {
            targetIp != null -> {
                // 单播
                client.send(ClientConfig.Type.JSON, bytes, targetIp, ordered)
            }
            onlySubscribers -> {
                // 仅向匹配能力的在线设备发送
                val matched = client.onlineDevices.filter { device ->
                    device.abilities.any { it == "${ClientConfig.ABILITY_PREFIX_TOPIC}$topic" }
                }
                for (device in matched) {
                    client.send(ClientConfig.Type.JSON, bytes, device.ip, ordered)
                }
            }
            else -> {
                // 广播（不保证顺序、不 ACK）
                client.send(ClientConfig.Type.JSON, bytes, null, false)
            }
        }
    }

    // ──────────────── 内部消息分发 ────────────────

    /**
     * 解析收到的 JSON 帧并分发给对应主题的监听器
     */
    private fun handleIncomingMessage(frame: FrameData, fromIp: String) {
        if (frame.type != ClientConfig.Type.JSON) return
        try {
            val jsonStr = String(frame.payload, Charsets.UTF_8)
            val json = JSONObject(jsonStr)
            val topicMsg = TopicMessage.from(json) ?: return
            topicManager.notifyListener(topicMsg.topic, topicMsg.payload)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse incoming message from $fromIp: ${e.message}")
        }
    }

    // ──────────────── 模型转换 ────────────────

    /**
     * client.LanDevice → model.LanDevice
     */
    private fun com.yuwjoo.myhome.module.udp.client.LanDevice.toModelDevice() = LanDevice(
        ipAddress = this.ip,
        deviceName = this.deviceName,
        online = this.online,
        abilities = this.abilities,
        lastHeartbeatTime = this.lastSeenAt,
        latestSeq = 0,
    )
}
