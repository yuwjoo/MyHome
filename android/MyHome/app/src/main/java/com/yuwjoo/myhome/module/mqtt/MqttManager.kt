package com.yuwjoo.myhome.module.mqtt

import android.os.Handler
import android.os.Looper
import android.util.Log
import java.util.concurrent.Executors
import java.util.concurrent.CopyOnWriteArraySet

/**
 * MQTT 管理器（单例），基于 [MqttCore] 封装连接、订阅、发布等操作。
 *
 * 使用缓存会话（cleanSession = false），Broker 记住订阅，重连后自动恢复。
 */
object MqttManager {

    private const val TAG = "MqttManager"

    // MQTT 核心
    private var mqttCore: MqttCore? = null

    // 主题级回调：topic → 回调列表
    private val topicCallbacks = mutableMapOf<String, MutableList<TopicCallback>>()

    // 连接状态监听列表
    private val connectionCallbacks = CopyOnWriteArraySet<ConnectionCallback>()

    // 主线程 Handler
    private val handler = Handler(Looper.getMainLooper())

    // IO 单线程执行器
    private val ioExecutor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "mqtt-io").apply { isDaemon = true }
    }

    /**
     * 是否已连接
     */
    val isConnected: Boolean
        get() = mqttCore?.isConnected == true

    // MqttCore 回调：转发连接状态和消息到上层监听方
    private val coreCallback = object : MqttCoreCallback {
        override fun onConnectionChanged(connected: Boolean, cause: Throwable?) {
            Log.d(TAG, "onConnectionChanged: connected=$connected, cause=${cause?.message}")
            handler.post {
                connectionCallbacks.forEach { it.onConnectionChanged(connected, cause) }
            }
        }

        override fun onMessageArrived(topic: String, payload: String) {
            Log.d(TAG, "onMessageArrived: topic=$topic, payload=$payload")
            handler.post {
                topicCallbacks[topic]?.forEach { it.onMessageArrived(topic, payload) }
            }
        }
    }

    /**
     * 注册连接状态监听
     */
    fun addConnectionCallback(callback: ConnectionCallback) {
        connectionCallbacks.add(callback)
    }

    /**
     * 移除连接状态监听
     */
    fun removeConnectionCallback(callback: ConnectionCallback) {
        connectionCallbacks.remove(callback)
    }

    /**
     * 连接 MQTT Broker
     *
     * Broker 自动恢复之前订阅的主题（缓存会话）。
     */
    fun connect() {
        if (mqttCore?.isConnected == true) return

        ioExecutor.execute {
            try {
                if (mqttCore == null) {
                    mqttCore = MqttCore(coreCallback)
                }
                mqttCore!!.connect()
            } catch (_: Exception) { }
        }
    }

    /**
     * 断开 MQTT 连接
     */
    fun disconnect() {
        ioExecutor.execute {
            try {
                mqttCore?.disconnect()
            } catch (_: Exception) { }
        }
    }

    /**
     * 订阅主题，监听消息
     *
     * 同一主题可注册多个回调。未连接时仅记录，缓存会话下连接后 Broker 自动恢复。
     *
     * @param topic    MQTT 主题
     * @param qos     服务质量，默认 1
     * @param callback 该主题的消息回调
     */
    fun subscribe(topic: String, qos: Int = 1, callback: TopicCallback) {
        topicCallbacks.getOrPut(topic) { mutableListOf() }.add(callback)

        if (mqttCore?.isConnected != true) return

        ioExecutor.execute {
            try {
                mqttCore?.subscribe(topic, qos)
            } catch (_: Exception) { }
        }
    }

    /**
     * 取消订阅主题，移除监听
     *
     * - [callback] 不为 null：仅移除该回调，无剩余回调时取消订阅
     * - [callback] 为 null：移除全部回调并取消订阅
     *
     * @param topic    要取消的主题
     * @param callback 要移除的回调，null 表示移除全部
     */
    fun unsubscribe(topic: String, callback: TopicCallback? = null) {
        if (callback != null) {
            topicCallbacks[topic]?.remove(callback)
            if (!topicCallbacks[topic].isNullOrEmpty()) return
        }
        topicCallbacks.remove(topic)

        ioExecutor.execute {
            try {
                mqttCore?.unsubscribe(topic)
            } catch (_: Exception) { }
        }
    }

    /**
     * 发布消息
     *
     * @param topic    MQTT 主题
     * @param payload 消息内容
     * @param qos     服务质量，默认 1
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
                mqttCore?.publish(topic, payload, qos, retained)
            } catch (_: Exception) { }
        }
    }
}
