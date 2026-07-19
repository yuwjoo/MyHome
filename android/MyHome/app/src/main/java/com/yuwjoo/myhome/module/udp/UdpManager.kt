package com.yuwjoo.myhome.module.udp

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import com.yuwjoo.myhome.common.ListenerRegistry
import com.yuwjoo.myhome.module.udp.listener.ConnectionListener
import com.yuwjoo.myhome.module.udp.listener.DeviceListener
import com.yuwjoo.myhome.module.udp.listener.TopicListener
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
    private val connectionListeners = ListenerRegistry<Unit, ConnectionListener>()

    private val seqTracker = SeqTracker() // 消息序号管理
    private val ackManager = AckManager(
        onRetry = { ip, data -> client.sendUnicast(data, ip) },
        onFailed = { ip, seqNum ->
            Log.w(TAG, "ack retry exhausted: ip=$ip seq=$seqNum")
        },
    )
    private val dispatcher = MessageDispatcher(client, deviceManager, topicManager, ackManager, seqTracker)
    private val heartbeatManager = HeartbeatManager(deviceManager, client) // 心跳管理器

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
        client.setMessageListener { frame, fromIp, _ ->
            dispatcher.dispatch(frame, fromIp)
        }

        client.setConnectionListener { connected ->
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
                if (isConnected) return@start
                acquireMulticastLock(context)
                client.connect()
            } else {
                if (!isConnected) return@start
                releaseMulticastLock()
                client.disconnect()
            }
        }
        acquireMulticastLock(context)
        client.connect()
        ackManager.start()
        heartbeatManager.start()
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        heartbeatManager.stop()
        networkMonitor.stop()
        releaseMulticastLock()
        try {
            val frame = UdpFrame.encode(
                type = UdpConfig.Type.OFFLINE,
                seqNum = 0,
                flags = UdpConfig.Flags.NONE,
                payload = ByteArray(0),
            )
            client.sendBroadcast(frame)
        } catch (e: Exception) {
            Log.e(TAG, "send offline failed: ${e.message}", e)
        }
        ackManager.stop()
        client.disconnect()
    }

    /**
     * 持有组播锁
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
     */
    fun registerDeviceListener(listener: DeviceListener) {
        deviceManager.registerListener(listener)
    }

    /**
     * 取消注册设备变更监听器
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
     */
    fun registerConnectionListener(listener: ConnectionListener) {
        connectionListeners.register(Unit, listener)
    }

    /**
     * 取消注册连接状态监听器
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
     */
    fun subscribe(topic: String, callback: TopicListener) {
        topicManager.registerListener(topic, callback)
    }

    /**
     * 取消订阅主题
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
     * @param topic    业务主题
     * @param payload  消息内容
     * @param targetIp 目标 IP，null 则广播
     * @param ordered  是否有序不重复，默认 true
     * @param needAck  是否需要 Ack 保证送达，默认 true
     */
    fun publish(topic: String, payload: JSONObject, targetIp: String? = null, ordered: Boolean = true, needAck: Boolean = true) {
        if (targetIp != null) {
            publishUnicast(topic, payload, targetIp, ordered, needAck)
        } else {
            val payloadBytes = TopicMessage.toBytes(topic, payload)
            val frame = UdpFrame.encode(
                type = UdpConfig.Type.JSON,
                seqNum = 0,
                flags = UdpConfig.Flags.NONE,
                payload = payloadBytes,
            )
            client.sendBroadcast(frame)
        }
    }

    /**
     * 发布消息
     *
     * @param onlySubscribers 是否仅发给订阅者
     * @param ordered         是否有序不重复，默认 true
     * @param needAck         是否需要 Ack 保证送达，默认 true
     * @return 发送的设备数
     */
    fun publish(topic: String, payload: JSONObject, onlySubscribers: Boolean, ordered: Boolean = true, needAck: Boolean = true): Int {
        if (!onlySubscribers) {
            publish(topic, payload, ordered = ordered, needAck = needAck)
            return -1
        }
        var count = 0
        for (device in deviceManager.onlineDeviceList) {
            if (UdpConfig.ABILITY_PREFIX_TOPIC + topic in device.abilities) {
                publishUnicast(topic, payload, device.ipAddress, ordered, needAck)
                count++
            }
        }
        return count
    }

    /**
     * 单播发送 JSON 消息
     *
     * @param topic    业务主题
     * @param payload  消息内容
     * @param targetIp 目标 IP
     * @param ordered  是否有序不重复
     * @param needAck  是否需要 Ack 保证送达
     */
    private fun publishUnicast(topic: String, payload: JSONObject, targetIp: String, ordered: Boolean, needAck: Boolean) {
        val seqNum = if (ordered) seqTracker.nextSeq(targetIp) else 0
        val flags = (if (ordered) UdpConfig.Flags.ORDERED else 0) + (if (needAck) UdpConfig.Flags.ACK_REQUIRED else 0)
        val payloadBytes = TopicMessage.toBytes(topic, payload)
        val frame = UdpFrame.encode(
            type = UdpConfig.Type.JSON,
            seqNum = seqNum,
            flags = flags.toByte(),
            payload = payloadBytes,
        )
        client.sendUnicast(frame, targetIp)
        if (needAck) {
            ackManager.register(targetIp, seqNum, frame)
        }
    }
}
