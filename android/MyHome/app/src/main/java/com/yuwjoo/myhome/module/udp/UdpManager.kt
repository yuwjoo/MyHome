package com.yuwjoo.myhome.module.udp

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.common.ListenerRegistry
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import com.yuwjoo.myhome.module.udp.client.config.LocalConfig
import com.yuwjoo.myhome.module.udp.client.UdpClient
import com.yuwjoo.myhome.module.udp.client.model.FrameData
import com.yuwjoo.myhome.module.udp.client.model.LanDevice
import com.yuwjoo.myhome.module.udp.listener.ConnectionListener
import com.yuwjoo.myhome.module.udp.listener.DeviceListener
import com.yuwjoo.myhome.module.udp.listener.TopicListener
import com.yuwjoo.myhome.module.udp.model.TopicMessage
import org.json.JSONObject

/**
 * UDP 管理器
 */
object UdpManager {

    private const val TAG = "UdpManager"

    private val client = UdpClient() // 底层 UDP 客户端
    private val topicListeners = ListenerRegistry<String, TopicListener>() // 主题消息监听器
    private val connectionListeners = ListenerRegistry<Unit, ConnectionListener>() // 连接状态监听器
    private val deviceListeners = ListenerRegistry<Unit, DeviceListener>() // 设备变更监听器

    @Volatile
    var isConnected = false // 当前连接状态
        private set

    val deviceList: List<LanDevice> // 所有设备列表
        get() = client.devices

    val onlineDeviceList: List<LanDevice> // 在线设备列表
        get() = client.onlineDevices

    /**
     * 启动 UDP 通信
     *
     * @param context 用于注册网络变化监听的 Context
     */
    fun connect(context: Context) {
        if (isConnected) return

        client.onDeviceChanged = { _ -> // 设备列表变更 → 转发给上层监听器
            deviceListeners.dispatch(Unit) { it.onDeviceChanged(client.devices) }
        }

        client.onConnectionChanged = { connected -> // 连接状态变更 → 更新标志位并转发
            isConnected = connected
            connectionListeners.dispatch(Unit) { it.onConnectionChanged(connected) }
        }

        client.onMessageReceived = { frame, fromIp, isJson -> // 收到消息 → JSON 帧交给主题分发
            handleIncomingMessage(frame, fromIp)
        }

        client.connect(context)
    }

    /**
     * 停止 UDP 通信
     */
    fun disconnect() {
        client.disconnect()
        isConnected = false
    }

    /**
     * 订阅主题
     *
     * @param topic    主题名称
     * @param callback 消息到达时的回调
     */
    fun subscribe(topic: String, callback: TopicListener) {
        topicListeners.register(topic, callback)
    }

    /**
     * 取消订阅主题
     *
     * @param topic    主题名称
     * @param callback 待移除的回调
     */
    fun unsubscribe(topic: String, callback: TopicListener) {
        topicListeners.unregister(topic, callback)
    }

    /**
     * 发布主题消息
     *
     * @param topic           主题名称
     * @param payload         负载数据
     * @param targetIp        目标 IP，为 null 时广播
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
                client.send(FrameConfig.Type.JSON, bytes, targetIp, ordered)
            }
            onlySubscribers -> {
                val prefix = "${LocalConfig.ABILITY_PREFIX_TOPIC}$topic"
                val matched = client.onlineDevices.filter { device ->
                    device.abilities.any { it == prefix }
                }
                for (device in matched) {
                    client.send(FrameConfig.Type.JSON, bytes, device.ip, ordered)
                }
            }
            else -> {
                client.send(FrameConfig.Type.JSON, bytes, null, false)
            }
        }
    }

    /**
     * 注册设备列表变更监听
     *
     * @param listener 设备变更回调
     */
    fun registerDeviceListener(listener: DeviceListener) {
        deviceListeners.register(Unit, listener)
    }

    /**
     * 注销设备列表变更监听
     *
     * @param listener 待移除的监听器
     */
    fun unregisterDeviceListener(listener: DeviceListener) {
        deviceListeners.unregister(Unit, listener)
    }

    /**
     * 注册连接状态变更监听
     *
     * @param listener 连接状态回调
     */
    fun registerConnectionListener(listener: ConnectionListener) {
        connectionListeners.register(Unit, listener)
    }

    /**
     * 注销连接状态变更监听
     *
     * @param listener 待移除的监听器
     */
    fun unregisterConnectionListener(listener: ConnectionListener) {
        connectionListeners.unregister(Unit, listener)
    }

    /**
     * 解析收到的 JSON 帧并分发给对应主题的监听器
     *
     * @param frame  收到的帧数据
     * @param fromIp 来源 IP
     */
    private fun handleIncomingMessage(frame: FrameData, fromIp: String) {
        if (frame.type != FrameConfig.Type.JSON) return
        try {
            val json = JSONObject(String(frame.payload, Charsets.UTF_8))
            val topicMsg = TopicMessage.from(json) ?: return
            topicListeners.dispatch(topicMsg.topic) { it.onMessageArrived(topicMsg.topic, topicMsg.payload) }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse incoming message from $fromIp: ${e.message}")
        }
    }
}
