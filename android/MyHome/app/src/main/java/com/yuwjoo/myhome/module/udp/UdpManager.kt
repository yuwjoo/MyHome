package com.yuwjoo.myhome.module.udp

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import com.yuwjoo.myhome.module.udp.listener.DeviceListener
import com.yuwjoo.myhome.module.udp.listener.TopicListener
import com.yuwjoo.myhome.module.udp.model.LocalDevice
import com.yuwjoo.myhome.module.udp.model.LanDevice
import com.yuwjoo.myhome.module.udp.model.TopicMessage
import org.json.JSONObject

/**
 * UDP 管理器
 */
object UdpManager {

    private const val TAG = "UdpManager"
    private const val MULTICAST_LOCK_TAG = "MyHome:UdpMulticast"

    private val client = UdpClient()

    private val topicManager = TopicManager()
    private val deviceManager = DeviceManager()
    private val heartbeatManager = HeartbeatManager(deviceManager, client)

    val deviceList: List<LanDevice> // 全部设备列表
        get() = deviceManager.deviceList

    val onlineDeviceList: List<LanDevice> // 在线设备列表
        get() = deviceManager.onlineDeviceList

    val isConnected: Boolean // 是否已连接组播
        get() = client.isConnected

    private var wifiManager: WifiManager? = null // WiFi 管理器
    private var multicastLock: WifiManager.MulticastLock? = null // 组播锁

    init {
        client.setMessageListener { data, fromIp, fromPort ->
            // 架构消息
            if (data.size == 1) {
                when (data[0]) {
                    // 心跳消息
                    0x01.toByte() -> {
                        deviceManager.updateHeartbeatTime(fromIp)
                        if (!deviceManager.hasDevice(fromIp)) {
                            val localPayload = LocalDevice.toObject(deviceManager.createLocalDevice())
                            client.send(TopicMessage.toBytes(UdpConfig.TOPIC_CALL, localPayload), fromIp)
                        }
                    }
                    // 离线消息
                    0x02.toByte() -> {
                        deviceManager.updateOnlineStatus(fromIp, false)
                    }
                }
                return@setMessageListener
            }
            val msgText = String(data, Charsets.UTF_8)
            val msg = TopicMessage.from(msgText) ?: return@setMessageListener
            when (msg.topic) {
                // 呼叫主题
                UdpConfig.TOPIC_CALL -> {
                    val payload = msg.payload ?: return@setMessageListener
                    val device = LanDevice.from(fromIp, payload) ?: return@setMessageListener
                    deviceManager.saveDevice(device)
                    val localPayload = LocalDevice.toObject(deviceManager.createLocalDevice())
                    client.send(TopicMessage.toBytes(UdpConfig.TOPIC_RESPONSE, localPayload), fromIp)
                }
                // 应答主题
                UdpConfig.TOPIC_RESPONSE -> {
                    val payload = msg.payload ?: return@setMessageListener
                    val device = LanDevice.from(fromIp, payload) ?: return@setMessageListener
                    deviceManager.saveDevice(device)
                }
                else -> {
                    Log.d(TAG, "onMessageArrived: topic=${msg.topic}")
                    topicManager.notifyListener(msg.topic, msg.payload)
                }
            }
        }

        client.setConnectionListener { connected ->
            if (connected) {
                heartbeatManager.start()
            } else {
                heartbeatManager.stop()
            }
        }
    }

    /**
     * 连接到组播组并启动消息接收
     *
     * @param context 用于获取组播锁的上下文，传入 null 则不申请锁
     */
    fun connect(context: Context? = null) {
        if (context != null && wifiManager == null) {
            wifiManager =
                context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        }
        multicastLock?.release()
        multicastLock = wifiManager?.createMulticastLock(MULTICAST_LOCK_TAG)?.apply {
            acquire()
        }
        client.connect()
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        heartbeatManager.stop()
        try {
            client.send(byteArrayOf(0x02))
        } catch (e: Exception) {
            Log.e(TAG, "send offline failed: ${e.message}", e)
        }
        multicastLock?.release()
        multicastLock = null
        client.disconnect()
    }

    /**
     * 注册设备变更监听器
     *
     * @param listener 设备变更回调
     */
    fun registerDeviceListener(listener: DeviceListener) {
        deviceManager.registerListener(listener)
    }

    /**
     * 取消注册设备变更监听器
     *
     * @param listener 已注册的监听器
     */
    fun unregisterDeviceListener(listener: DeviceListener) {
        deviceManager.unregisterListener(listener)
    }

    /**
     * 清空所有设备变更监听器
     */
    fun clearDeviceListeners() {
        deviceManager.clearAllListener()
    }

    /**
     * 订阅主题
     *
     * @param topic    主题名称
     * @param callback 消息回调
     */
    fun subscribe(topic: String, callback: TopicListener) {
        topicManager.registerListener(topic, callback)
    }

    /**
     * 取消订阅主题
     *
     * @param topic    主题名称
     * @param callback 要移除的回调
     */
    fun unsubscribe(topic: String, callback: TopicListener? = null) {
        if (callback == null) {
            topicManager.clearTopicListener(topic)
        } else {
            topicManager.unregisterListener(topic, callback)
        }
    }

    /**
     * 发布消息
     *
     * @param topic    主题
     * @param payload  消息内容
     * @param targetIp 目标 IP
     */
    fun publish(topic: String, payload: JSONObject, targetIp: String? = null) {
        client.send(TopicMessage.toBytes(topic, payload), targetIp)
    }

    /**
     * 发布消息
     *
     * @param topic           主题
     * @param payload         消息内容
     * @param onlySubscribers 是否仅发给订阅者
     * @return 发送的设备数
     */
    fun publish(topic: String, payload: JSONObject, onlySubscribers: Boolean): Int {
        if (!onlySubscribers) {
            client.send(TopicMessage.toBytes(topic, payload))
            return -1
        }
        val data = TopicMessage.toBytes(topic, payload)
        var count = 0
        for (device in deviceManager.onlineDeviceList) {
            if (UdpConfig.ABILITY_PREFIX_TOPIC + topic in device.abilities) {
                client.send(data, device.ipAddress)
                count++
            }
        }
        return count
    }

}


