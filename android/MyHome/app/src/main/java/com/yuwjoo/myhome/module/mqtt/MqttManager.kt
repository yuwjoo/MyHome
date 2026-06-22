package com.yuwjoo.myhome.module.mqtt

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.config.MqttTopics
import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import java.util.concurrent.Executors

/**
 * MqttManager — MQTT 连接与消息管理（单例）
 *
 * 职责：
 * - 管理 MQTT Broker 连接与自动重连
 * - 发布 / 订阅 / 取消订阅消息
 * - 分发消息到全局回调与主题级回调
 *
 * 使用前必须调用 [init] 传入 Context，之后通过 [getInstance] 获取单例。
 */
class MqttManager private constructor() {

    companion object {
        @Volatile
        private var instance: MqttManager? = null

        /**
         * 初始化单例
         * @param context Android Context（用于获取设备 ID 等）
         * @return MqttManager 单例实例
         */
        fun init(context: Context = throw IllegalStateException("必须提供 Context")): MqttManager {
            return instance ?: synchronized(this) {
                instance ?: MqttManager().also { instance = it }
            }
        }

        /**
         * 获取单例实例
         * @throws IllegalStateException 如果未先调用 [init]
         */
        fun getInstance(): MqttManager {
            return instance ?: throw IllegalStateException(
                "MqttManager 未初始化，请先调用 init(context)"
            )
        }
    }

    /** Paho MQTT 客户端实例 */
    private var client: MqttClient? = null

    /** 全局消息回调列表（所有消息都会触发） */
    private val callbacks = mutableListOf<MqttCallback>()

    /** 主题级回调映射：topic → 回调列表 */
    private val topicCallbacks = mutableMapOf<String, MutableList<MqttTopicCallback>>()

    /** 已订阅的主题集合（用于重连后恢复订阅） */
    private val subscribedTopics = mutableSetOf<String>()

    /** 主线程 Handler，用于回调切换到主线程 */
    private val handler = Handler(Looper.getMainLooper())

    /** IO 单线程执行器，所有网络 I/O 在此线程执行 */
    private val ioExecutor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "mqtt-io").apply { isDaemon = true }
    }

    /** 当前是否已连接到 Broker */
    val isConnected: Boolean
        get() = client?.isConnected == true

    // ──────────────── 回调管理 ────────────────

    /**
     * 注册全局消息回调
     * @param callback 回调实例，所有消息和连接事件都会通知
     */
    fun addCallback(callback: MqttCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    /**
     * 移除全局消息回调
     * @param callback 要移除的回调实例
     */
    fun removeCallback(callback: MqttCallback) {
        callbacks.remove(callback)
    }

    // ──────────────── 连接管理 ────────────────

    /**
     * 连接 MQTT Broker
     *
     * 在 IO 线程异步执行，连接成功后触发 [MqttCallback.onConnected]，
     * 并自动恢复之前订阅的所有主题。
     */
    fun connect() {
        if (client?.isConnected == true) return

        ioExecutor.execute {
            try {
                val mqttClient = MqttClient(
                    MqttConfig.BROKER_URL,           // Broker 地址（tcp://ip:port）
                    MqttConfig.clientId(),           // 客户端唯一标识
                    MemoryPersistence(),             // 内存暂存未发送消息（不持久化）
                )
                this.client = mqttClient

                mqttClient.setCallback(object : org.eclipse.paho.client.mqttv3.MqttCallback {
                    /**
                     * 连接丢失回调 — 网络断开或 Broker 崩溃时触发
                     * @param cause 断开原因（正常断开时为 null）
                     */
                    override fun connectionLost(cause: Throwable?) {
                        handler.post { callbacks.forEach { it.onDisconnected(cause) } }
                    }

                    /**
                     * 消息到达回调 — 收到订阅主题的消息时触发
                     * @param topic   消息所属主题
                     * @param message MQTT 消息体（含 payload、qos、retained 等）
                     */
                    override fun messageArrived(topic: String, message: MqttMessage) {
                        handler.post {
                            val payload = String(message.payload, Charsets.UTF_8)
                            callbacks.forEach { it.onMessageArrived(topic, payload) }
                            topicCallbacks[topic]?.forEach { it.onMessageArrived(topic, payload) }
                        }
                    }

                    /**
                     * 投递完成回调 — QoS 1/2 消息送达 Broker 后确认
                     * @param token 投递令牌，可追溯具体是哪个消息已送达
                     */
                    override fun deliveryComplete(token: org.eclipse.paho.client.mqttv3.IMqttDeliveryToken) {}
                })

                val options = MqttConnectOptions().apply {
                    userName = MqttConfig.USERNAME                           // Broker 认证用户名
                    password = MqttConfig.PASSWORD.toCharArray()             // Broker 认证密码
                    isCleanSession = MqttConfig.CLEAN_SESSION               // true=新会话不恢复订阅，false=持久会话
                    keepAliveInterval = MqttConfig.KEEP_ALIVE               // 心跳间隔（秒），超时 Broker 会发布遗嘱
                    connectionTimeout = MqttConfig.CONNECTION_TIMEOUT       // 连接超时（秒）
                    isAutomaticReconnect = true                             // 断线自动重连（Paho 内置）
                    maxReconnectDelay = MqttConfig.MAX_RECONNECT_DELAY     // 重连最大间隔（毫秒）

                    setWill(
                        MqttTopics.TOPIC_DEVICE_OFFLINE,                    // 遗嘱主题
                        MqttConfig.WILL_PAYLOAD.toByteArray(),             // 遗嘱消息体
                        MqttConfig.WILL_QOS,                                // 遗嘱 QoS
                        MqttConfig.WILL_RETAINED,                           // 遗嘱是否保留（新订阅者立即可见）
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

    /**
     * 断开 MQTT 连接
     *
     * 主动断开后触发 [MqttCallback.onDisconnected]。
     */
    fun disconnect() {
        ioExecutor.execute {
            try {
                client?.disconnect()
                handler.post { callbacks.forEach { it.onDisconnected(null) } }
            } catch (_: Exception) { }
        }
    }

    // ──────────────── 消息操作 ────────────────

    /**
     * 订阅主题
     * @param topic    MQTT 主题
     * @param qos      服务质量（0=最多一次，1=至少一次，2=恰好一次），默认 1
     * @param callback 该主题的消息回调，可选
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
                handler.post {
                    callbacks.forEach { it.onError(e) }
                }
            }
        }
    }

    /**
     * 取消订阅主题
     * @param topic    要取消的主题
     * @param callback 仅移除指定回调，null 时移除该主题的全部回调并取消订阅
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

    /**
     * 发布消息
     * @param topic    MQTT 主题
     * @param payload  消息体（字符串）
     * @param qos      服务质量，默认 1
     * @param retained 是否保留消息，默认 false
     */
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
