package com.yuwjoo.myhome.module.mqtt

import android.util.Log
import com.yuwjoo.myhome.config.MqttTopics
import com.yuwjoo.myhome.module.mqtt.callback.ConnectionCallback
import com.yuwjoo.myhome.module.mqtt.callback.TopicCallback
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended
import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import java.util.concurrent.CopyOnWriteArraySet
import java.util.concurrent.Executors

/**
 * MQTT 管理器（单例），封装连接、订阅、发布等操作。
 */
object MqttManager {

    private const val TAG = "MqttManager"

    // Mqtt 客户端实例
    private lateinit var client: MqttClient

    // 主题管理器
    private val topicManager = TopicManager()

    // 连接状态监听列表
    private val connectionCallbacks = CopyOnWriteArraySet<ConnectionCallback>()

    // IO 单线程执行器
    private val ioExecutor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "mqtt-io").apply { isDaemon = true }
    }

    init {
        client = MqttClient(
            MqttConfig.BROKER_URL,
            MqttConfig.clientId(),
            MemoryPersistence(),
        )
        client.setCallback(object : MqttCallbackExtended {
            override fun connectComplete(reconnect: Boolean, serverURI: String) {
                Log.d(TAG, "onConnectionChanged: connected=true, cause=null")
                topicManager.getTopicList().forEach { entry ->
                    subscribe(entry.topic, entry.qos)
                }
                connectionCallbacks.forEach { it.onConnectionChanged(true) }
            }

            override fun connectionLost(cause: Throwable?) {
                Log.d(TAG, "onConnectionChanged: connected=false, cause=${cause?.message}")
                topicManager.getTopicList().forEach { it.toPending() }
                connectionCallbacks.forEach { it.onConnectionChanged(false, cause) }
            }

            override fun messageArrived(topic: String, message: MqttMessage) {
                val payload = String(message.payload, Charsets.UTF_8)
                Log.d(TAG, "onMessageArrived: topic=$topic, payload=$payload")
                topicManager.notifyListeners(topic, payload)
            }

            override fun deliveryComplete(token: IMqttDeliveryToken) {}
        })
    }

    /**
     * 是否已连接
     */
    val isConnected: Boolean
        get() = client.isConnected

    /**
     * 注册连接状态监听器
     */
    fun registerConnectionListener(callback: ConnectionCallback) {
        connectionCallbacks.add(callback)
    }

    /**
     * 移除连接状态监听器
     */
    fun unregisterConnectionListener(callback: ConnectionCallback) {
        connectionCallbacks.remove(callback)
    }

    /**
     * 连接 MQTT Broker
     */
    fun connect() {
        if (client.isConnected) return

        ioExecutor.execute {
            val options = MqttConnectOptions().apply {
                userName = MqttConfig.USERNAME
                password = MqttConfig.PASSWORD.toCharArray()
                isCleanSession = MqttConfig.CLEAN_SESSION
                keepAliveInterval = MqttConfig.KEEP_ALIVE
                connectionTimeout = MqttConfig.CONNECTION_TIMEOUT
                isAutomaticReconnect = MqttConfig.AUTOMATIC_RECONNECT
                maxReconnectDelay = MqttConfig.MAX_RECONNECT_DELAY

                if (MqttConfig.ENABLE_WILL) {
                    setWill(
                        MqttTopics.TOPIC_DEVICE_OFFLINE,
                        MqttConfig.WILL_PAYLOAD.toByteArray(),
                        MqttConfig.WILL_QOS,
                        MqttConfig.WILL_RETAINED,
                    )
                }
            }
            client.connect(options)
        }
    }

    /**
     * 断开 MQTT 连接
     */
    fun disconnect() {
        ioExecutor.execute {
            client.disconnect()
        }
    }

    /**
     * 订阅主题，添加主题记录和消息监听器。
     *
     * @param topic    主题名称
     * @param qos      服务质量
     * @param callback 消息回调
     */
    fun subscribe(topic: String, qos: Int, callback: TopicCallback? = null) {
        val topicEntry = topicManager.saveTopic(topic, qos)
        if (callback != null) {
            topicManager.registerListener(topic, callback)
        }

        if (!client.isConnected) return

        ioExecutor.execute {
            try {
                client.subscribe(topic, qos)
                if (isConnected) topicEntry.toSuccess()
            } catch (_: Exception) {
                if (isConnected) topicEntry.toFailed()
            }
        }
    }

    /**
     * 取消订阅主题。
     *
     * - [callback] 不为 null：仅移除该回调
     * - [callback] 为 null：移除该主题全部回调
     *
     * 若该主题已无回调，则取消 MQTT 订阅，成功后删除主题记录。
     *
     * @param topic    主题名称
     * @param callback 要移除的回调，null 表示移除此主题所有回调
     */
    fun unsubscribe(topic: String, callback: TopicCallback? = null) {
        if (callback != null) {
            topicManager.unregisterListener(topic, callback)
        } else {
            topicManager.getListeners(topic).forEach {
                topicManager.unregisterListener(topic, it)
            }
        }

        if (!client.isConnected || !topicManager.getListeners(topic).isEmpty()) return

        ioExecutor.execute {
            client.unsubscribe(topic)
            topicManager.removeTopic(topic)
        }
    }

    /**
     * 发布消息
     *
     * @param topic    主题
     * @param payload  消息内容
     * @param qos      服务质量，默认 1
     * @param retained 是否保留，默认 false
     */
    fun publish(
        topic: String,
        payload: String,
        qos: Int = 1,
        retained: Boolean = false,
    ) {
        ioExecutor.execute {
            client.publish(topic, MqttMessage().apply {
                this.payload = payload.toByteArray(Charsets.UTF_8)
                this.qos = qos
                this.isRetained = retained
            })
        }
    }
}
