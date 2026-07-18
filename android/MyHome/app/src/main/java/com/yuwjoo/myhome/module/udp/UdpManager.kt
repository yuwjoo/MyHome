package com.yuwjoo.myhome.module.udp

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import com.yuwjoo.myhome.common.ListenerRegistry
import com.yuwjoo.myhome.module.udp.listener.ConnectionListener
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
    private val connectionListeners = ListenerRegistry<Unit, ConnectionListener>()

    val deviceList: List<LanDevice> // 全部设备列表
        get() = deviceManager.deviceList

    val onlineDeviceList: List<LanDevice> // 在线设备列表
        get() = deviceManager.onlineDeviceList

    val isConnected: Boolean // 是否已连接组播
        get() = client.isConnected

    private val networkMonitor = NetworkMonitor() // 网络状态监听
    private var wifiManager: WifiManager? = null // WiFi 管理器
    private var multicastLock: WifiManager.MulticastLock? = null // 组播锁

    init {
        client.setMessageListener { data, fromIp, fromPort ->
            // 架构消息
            if (data.size == 1) {
                when (data[0]) {
                    // 心跳消息
                    0x01.toByte() -> {
                        Log.d(TAG, "收到心跳" + fromIp)
                        if (deviceManager.hasDevice(fromIp)) {
                            deviceManager.updateHeartbeatTime(fromIp)
                        } else {
                            val localPayload =
                                LocalDevice.toObject(deviceManager.createLocalDevice())
                            client.sendUnicast(
                                TopicMessage.toBytes(UdpConfig.TOPIC_CALL, localPayload),
                                fromIp
                            )
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
                    client.sendUnicast(
                        TopicMessage.toBytes(UdpConfig.TOPIC_RESPONSE, localPayload),
                        fromIp
                    )
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
            connectionListeners.dispatch(Unit) { it.onConnectionChanged(connected) }
        }
    }

    /**
     * 连接
     *
     * @param context 用于监听网络变化
     */
    fun connect(context: Context) {
        networkMonitor.start(context) { available ->
            Log.d(TAG, "network available changed: $available")
            if (available) {
                acquireMulticastLock(context)
                client.connect()
            } else {
                releaseMulticastLock()
                client.disconnect()
            }
        }
        acquireMulticastLock(context)
        client.connect()
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        heartbeatManager.stop()
        networkMonitor.stop()
        releaseMulticastLock()
        try {
            client.sendBroadcast(byteArrayOf(0x02))
        } catch (e: Exception) {
            Log.e(TAG, "send offline failed: ${e.message}", e)
        }
        client.disconnect()
    }

    /**
     * 持有组播锁
     *
     * @param context 用于获取 WiFi 服务
     */
    @Synchronized
    private fun acquireMulticastLock(context: Context) {
        if (multicastLock != null) return
        if (wifiManager == null) {
            wifiManager =
                context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        }
        multicastLock = wifiManager?.createMulticastLock(MULTICAST_LOCK_TAG)?.apply {
            acquire()
        }
        Log.d(TAG, "multicast lock acquired")
    }

    /**
     * 释放组播锁
     */
    @Synchronized
    private fun releaseMulticastLock() {
        multicastLock?.release()
        multicastLock = null
        Log.d(TAG, "multicast lock released")
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
     * 注册连接状态监听器
     *
     * @param listener 连接状态回调
     */
    fun registerConnectionListener(listener: ConnectionListener) {
        connectionListeners.register(Unit, listener)
    }

    /**
     * 取消注册连接状态监听器
     *
     * @param listener 已注册的监听器
     */
    fun unregisterConnectionListener(listener: ConnectionListener) {
        connectionListeners.unregister(Unit, listener)
    }

    /**
     * 清空所有连接状态监听器
     */
    fun clearConnectionListeners() {
        connectionListeners.clearAll()
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
        val data = TopicMessage.toBytes(topic, payload)
        if (targetIp != null) {
            client.sendUnicast(data, targetIp)
        } else {
            client.sendBroadcast(data)
        }
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
            client.sendBroadcast(TopicMessage.toBytes(topic, payload))
            return -1
        }
        val data = TopicMessage.toBytes(topic, payload)
        var count = 0
        for (device in deviceManager.onlineDeviceList) {
            if (UdpConfig.ABILITY_PREFIX_TOPIC + topic in device.abilities) {
                client.sendUnicast(data, device.ipAddress)
                count++
            }
        }
        return count
    }

}


