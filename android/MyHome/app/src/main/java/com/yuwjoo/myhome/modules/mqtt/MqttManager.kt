package com.yuwjoo.myhome.modules.mqtt

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.config.MqttTopics
import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import java.util.concurrent.Executors

class MqttManager private constructor() {

    companion object {
        @Volatile
        private var instance: MqttManager? = null

        fun init(context: Context = throw IllegalStateException("必须提供 Context")): MqttManager {
            return instance ?: synchronized(this) {
                instance ?: MqttManager().also { instance = it }
            }
        }

        fun getInstance(): MqttManager {
            return instance ?: throw IllegalStateException(
                "MqttManager 未初始化，请先调用 init(context)"
            )
        }
    }

    private var client: MqttClient? = null
    private val callbacks = mutableListOf<MqttCallback>()
    private val topicCallbacks = mutableMapOf<String, MutableList<MqttTopicCallback>>()
    private val subscribedTopics = mutableSetOf<String>()
    private val handler = Handler(Looper.getMainLooper())
    private val ioExecutor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "mqtt-io").apply { isDaemon = true }
    }

    val isConnected: Boolean
        get() = client?.isConnected == true

    // ──────────────── 回调管理 ────────────────

    fun addCallback(callback: MqttCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: MqttCallback) {
        callbacks.remove(callback)
    }

    // ──────────────── 连接管理 ────────────────

    fun connect() {
        if (client?.isConnected == true) return

        ioExecutor.execute {
            try {
                val mqttClient = MqttClient(
                    MqttConfig.BROKER_URL,
                    MqttConfig.clientId(),
                    MemoryPersistence(),
                )
                this.client = mqttClient

                mqttClient.setCallback(object : org.eclipse.paho.client.mqttv3.MqttCallback {
                    override fun connectionLost(cause: Throwable?) {
                        handler.post { callbacks.forEach { it.onDisconnected(cause) } }
                    }

                    override fun messageArrived(topic: String, message: MqttMessage) {
                        handler.post {
                            val payload = String(message.payload, Charsets.UTF_8)
                            callbacks.forEach { it.onMessageArrived(topic, payload) }
                            topicCallbacks[topic]?.forEach { it.onMessageArrived(topic, payload) }
                        }
                    }

                    override fun deliveryComplete(token: org.eclipse.paho.client.mqttv3.IMqttDeliveryToken) {}
                })

                val options = MqttConnectOptions().apply {
                    userName = MqttConfig.USERNAME
                    password = MqttConfig.PASSWORD.toCharArray()
                    isCleanSession = MqttConfig.CLEAN_SESSION
                    keepAliveInterval = MqttConfig.KEEP_ALIVE
                    connectionTimeout = MqttConfig.CONNECTION_TIMEOUT
                    isAutomaticReconnect = true
                    maxReconnectDelay = MqttConfig.MAX_RECONNECT_DELAY

                    setWill(
                        MqttTopics.TOPIC_DEVICE_OFFLINE,
                        MqttConfig.WILL_PAYLOAD.toByteArray(),
                        MqttConfig.WILL_QOS,
                        MqttConfig.WILL_RETAINED,
                    )
                }

                mqttClient.connect(options)
                handler.post { callbacks.forEach { it.onConnected() } }

                // 重新订阅已注册的主题（automaticReconnect 只负责重连，不重订阅）
                resubscribeAll()
            } catch (e: Exception) {
                handler.post {
                    callbacks.forEach { it.onError(e) }
                }
            }
        }
    }

    fun disconnect() {
        ioExecutor.execute {
            try {
                client?.disconnect()
                handler.post { callbacks.forEach { it.onDisconnected(null) } }
            } catch (_: Exception) { }
        }
    }

    // ──────────────── 消息操作 ────────────────

    fun subscribe(topic: String, qos: Int = 1, callback: MqttTopicCallback? = null) {
        if (callback != null) {
            topicCallbacks.getOrPut(topic) { mutableListOf() }.add(callback)
        }

        if (subscribedTopics.contains(topic)) return
        subscribedTopics.add(topic)

        if (client?.isConnected != true) return

        ioExecutor.execute {
            try {
                client?.subscribe(topic, qos)
            } catch (e: Exception) {
                handler.post {
                    callbacks.forEach { it.onError(e) }
                }
            }
        }
    }

    fun unsubscribe(topic: String, callback: MqttTopicCallback? = null) {
        if (callback != null) {
            topicCallbacks[topic]?.remove(callback)
            if (topicCallbacks[topic].isNullOrEmpty()) {
                topicCallbacks.remove(topic)
                doUnsubscribe(topic)
            }
        } else {
            topicCallbacks.remove(topic)
            doUnsubscribe(topic)
        }
    }

    private fun doUnsubscribe(topic: String) {
        subscribedTopics.remove(topic)
        ioExecutor.execute {
            try {
                client?.unsubscribe(topic)
            } catch (_: Exception) { }
        }
    }

    /**
     * 连接/重连后恢复所有已注册的主题订阅
     */
    private fun resubscribeAll() {
        val topics = subscribedTopics.toSet()
        for (topic in topics) {
            try {
                client?.subscribe(topic, 1)
            } catch (_: Exception) { }
        }
    }

    fun publish(
        topic: String,
        payload: String,
        qos: Int = 1,
        retained: Boolean = false,
    ) {
        ioExecutor.execute {
            try {
                client?.publish(
                    topic,
                    MqttMessage().apply {
                        this.payload = payload.toByteArray(Charsets.UTF_8)
                        this.qos = qos
                        this.isRetained = retained
                    },
                )
            } catch (e: Exception) {
                handler.post {
                    callbacks.forEach { it.onError(e) }
                }
            }
        }
    }
}
