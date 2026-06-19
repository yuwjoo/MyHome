package com.yuwjoo.myhomeserver.modules.mqtt

import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhomeserver.config.MqttConfig
import com.yuwjoo.myhomeserver.config.MqttTopics
import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import java.util.concurrent.Executors

/**
 * MQTT 核心管理器
 *
 * 单例，管理 MQTT 连接的建立/断开、消息发布订阅、回调分发。
 * 采用守护线程池执行 IO 操作，回调统一 post 到主线程，确保 UI 安全。
 *
 * ### 设计要点
 * - **单例 + 双重检查锁**：全局唯一实例，线程安全
 * - **IO 线程隔离**：connect/subscribe/publish 均在 mqtt-io 守护线程执行
 * - **主线程回调**：所有 MqttCallback/MqttTopicCallback 回调通过 Handler post 到主线程
 * - **自动重连 + 重订阅**：启用 Paho automaticReconnect，重连后自动恢复已注册 topic
 * - **遗嘱消息**：连接时设置 will，异常断开时 broker 自动发布离线通知
 *
 * ### 使用方式
 * ```kotlin
 * // 初始化（仅需一次）
 * MqttManager.init()
 *
 * // 注册回调 + 连接
 * val mqtt = MqttManager.getInstance()
 * mqtt.addCallback(myCallback)
 * mqtt.connect()
 *
 * // 订阅直播指令
 * mqtt.subscribe(MqttTopics.TOPIC_LIVE_COMMAND, qos = 1, callback = liveCallback)
 *
 * // 发送状态
 * mqtt.publish(MqttTopics.TOPIC_LIVE_STATUS, """{"status":"streaming"}""")
 * ```
 */
class MqttManager private constructor() {

    companion object {
        @Volatile
        private var instance: MqttManager? = null

        fun init(): MqttManager {
            return instance ?: synchronized(this) {
                instance ?: MqttManager().also { instance = it }
            }
        }

        fun getInstance(): MqttManager {
            return instance ?: throw IllegalStateException(
                "MqttManager 未初始化，请先调用 init()"
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

    // ════════════════ 回调管理 ════════════════

    fun addCallback(callback: MqttCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: MqttCallback) {
        callbacks.remove(callback)
    }

    // ════════════════ 连接管理 ════════════════

    /**
     * 连接到 MQTT broker
     * 若已连接则直接返回；支持自动重连，重连后自动恢复主题订阅。
     */
    fun connect() {
        if (client?.isConnected == true) return

        ioExecutor.execute {
            try {
                val mqttClient = MqttClient(
                    MqttConfig.BROKER_URL,
                    MqttConfig.clientId(),
                    MemoryPersistence(),
                )
                client = mqttClient

                mqttClient.setCallback(object : org.eclipse.paho.client.mqttv3.MqttCallback {
                    override fun connectionLost(cause: Throwable?) {
                        handler.post {
                            callbacks.forEach { it.onDisconnected(cause) }
                        }
                    }

                    override fun messageArrived(topic: String, message: MqttMessage) {
                        handler.post {
                            val payload = String(message.payload, Charsets.UTF_8)
                            callbacks.forEach { it.onMessageArrived(topic, payload) }
                            topicCallbacks[topic]?.forEach { it.onMessageArrived(topic, payload) }
                        }
                    }

                    override fun deliveryComplete(
                        token: org.eclipse.paho.client.mqttv3.IMqttDeliveryToken,
                    ) {}
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
                resubscribeAll()
            } catch (e: Exception) {
                handler.post { callbacks.forEach { it.onError(e) } }
            }
        }
    }

    /** 断开连接（正常退出） */
    fun disconnect() {
        ioExecutor.execute {
            try {
                client?.disconnect()
                handler.post { callbacks.forEach { it.onDisconnected(null) } }
            } catch (_: Exception) {}
        }
    }

    // ════════════════ 消息操作 ════════════════

    /**
     * 订阅主题
     *
     * @param topic    MQTT 主题名
     * @param qos      QoS 等级，默认 1
     * @param callback 可选按主题回调，消息到达时触发
     */
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
                handler.post { callbacks.forEach { it.onError(e) } }
            }
        }
    }

    /**
     * 取消订阅
     *
     * @param topic    目标主题
     * @param callback 若提供则仅移除指定回调（不取消订阅），否则取消整个主题
     */
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
            } catch (_: Exception) {}
        }
    }

    /** 发送消息 */
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
                handler.post { callbacks.forEach { it.onError(e) } }
            }
        }
    }

    // ════════════════ 内部 ════════════════

    /** 连接/重连后恢复所有已注册的主题订阅（Paho automaticReconnect 只管重连不管重订阅） */
    private fun resubscribeAll() {
        val topics = subscribedTopics.toSet()
        for (topic in topics) {
            try {
                client?.subscribe(topic, 1)
            } catch (_: Exception) {}
        }
    }
}
