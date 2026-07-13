package com.yuwjoo.myhome.module.udp

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import org.json.JSONObject

/**
 * UDP 管理器（单例），封装组播通信与设备发现。
 */
object UdpManager {

    private const val TAG = "UdpManager"
    private const val MULTICAST_LOCK_TAG = "MyHome:UdpMulticast"

    private val client = UdpClient()

    private val topicManager = TopicManager()
    private val deviceManager = DeviceManager()

    val deviceList: List<UdpLocalDevice> // 全部设备列表
        get() = deviceManager.deviceList

    val onlineDeviceList: List<UdpLocalDevice> // 在线设备列表
        get() = deviceManager.onlineDeviceList

    val isConnected: Boolean // 是否已连接组播
        get() = client.isConnected

    private var wifiManager: WifiManager? = null // WiFi 管理器
    private var multicastLock: WifiManager.MulticastLock? = null // 组播锁

    private val localDevice = LocalDevice() // 本机设备

    init {
        client.setMessageCallback { data, fromIp, fromPort ->
            val msgText = String(data, Charsets.UTF_8)
            val msg = TopicManager.parseMessage(msgText) ?: return@setMessageCallback
            when (msg.topic) {
                // 设备扫描主题
                UdpConfig.TOPIC_SCAN_DEVICES -> {
                    localDevice.online = true
                    val payload = LocalDevice.toPayload(localDevice)
                    val data = TopicManager.buildMessage(UdpConfig.TOPIC_LOCAL_DEVICE, payload)
                    client.send(data, fromIp)
                }
                // 本地设备信息主题
                UdpConfig.TOPIC_LOCAL_DEVICE -> {
                    val device =
                        UdpLocalDevice.fromPayload(msg.payload, fromIp) ?: return@setMessageCallback
                    deviceManager.saveDevice(device)
                }
                // 其他主题
                else -> {
                    Log.d(TAG, "onMessageArrived: topic=${msg.topic}")
                    topicManager.notifyListener(msg.topic, msg.payload)
                }
            }
        }

        client.setConnectionCallback { connected ->
            localDevice.online = connected
            client.send(
                TopicManager.buildMessage(
                    UdpConfig.TOPIC_LOCAL_DEVICE,
                    LocalDevice.toPayload(localDevice)
                )
            )
            if (connected) scanDevices()
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
     * 断开连接并释放所有资源
     */
    fun disconnect() {
        multicastLock?.release()
        multicastLock = null
        client.disconnect()
    }

    /**
     * 注册设备变更监听器
     *
     * @param listener 设备变更回调
     */
    fun registerDeviceListener(listener: DeviceChangeListener) {
        deviceManager.registerListener(listener)
    }

    /**
     * 取消注册设备变更监听器
     *
     * @param listener 已注册的监听器
     */
    fun unregisterDeviceListener(listener: DeviceChangeListener) {
        deviceManager.unregisterListener(listener)
    }

    /**
     * 清空所有设备变更监听器
     */
    fun clearDeviceListeners() {
        deviceManager.clearAllListener()
    }

    /**
     * 组播发送扫描设备消息
     */
    fun scanDevices() {
        val data = TopicManager.buildMessage(UdpConfig.TOPIC_SCAN_DEVICES)
        repeat(UdpConfig.SCAN_COUNT) { i ->
            try {
                client.send(data)
            } catch (e: Exception) {
                Log.e(TAG, "scanDevices error round=$i: ${e.message}", e)
            }
            if (i < UdpConfig.SCAN_COUNT - 1) Thread.sleep(UdpConfig.SCAN_INTERVAL)
        }
    }

    /**
     * 订阅主题
     *
     * @param topic    主题名称
     * @param callback 消息回调
     */
    fun subscribe(topic: String, callback: UdpTopicCallback) {
        topicManager.registerListener(topic, callback)
    }

    /**
     * 取消订阅主题，callback 为 null 时清除该主题全部监听器
     *
     * @param topic    主题名称
     * @param callback 要移除的回调，null 表示清除所有
     */
    fun unsubscribe(topic: String, callback: UdpTopicCallback? = null) {
        if (callback == null) {
            topicManager.clearTopicListeners(topic)
        } else {
            topicManager.unregisterListener(topic, callback)
        }
    }

    /**
     * 发布消息，targetIp 为 null 时组播，否则单播到指定 IP
     *
     * @param topic    主题
     * @param payload  消息内容
     * @param targetIp 目标 IP，null 表示组播
     */
    fun publish(topic: String, payload: JSONObject, targetIp: String? = null) {
        client.send(TopicManager.buildMessage(topic, payload), targetIp)
    }

    /**
     * 仅向订阅了该主题的在线设备发送消息
     *
     * @param topic          主题
     * @param payload        消息内容
     * @param onlySubscribers 是否仅发给订阅者，传 true 时生效
     * @return 成功发送的设备数，onlySubscribers 为 false 时返回 -1
     */
    fun publish(topic: String, payload: JSONObject, onlySubscribers: Boolean): Int {
        if (!onlySubscribers) {
            client.send(TopicManager.buildMessage(topic, payload))
            return -1
        }
        val data = TopicManager.buildMessage(topic, payload)
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

/**
 * 主题消息回调。
 */
fun interface UdpTopicCallback {
    /**
     * 收到匹配主题的消息
     *
     * @param topic   消息主题
     * @param payload 负载数据
     */
    fun onMessageArrived(topic: String, payload: JSONObject?)
}
