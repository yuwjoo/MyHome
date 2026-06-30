package com.yuwjoo.myhome.module.mqtt

import com.yuwjoo.myhome.config.MqttTopics
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended
import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence

/**
 * Paho MQTT 客户端封装，构造函数接收 [MqttCoreCallback] 并完成初始化与 setCallback。
 *
 * @param callback 事件回调接口
 */
class MqttCore(private val callback: MqttCoreCallback) {

    // Mqtt 客户端实例
    private val client: MqttClient = MqttClient(
        MqttConfig.BROKER_URL,       // Broker 地址
        MqttConfig.clientId(),       // 客户端 ID
        MemoryPersistence(),         // 内存持久化
    )

    /**
     * 是否已连接
     */
    val isConnected: Boolean get() = client.isConnected

    // 注册 Paho 回调（Extended 含 connectComplete，自动重连后也能感知）
    init {
        client.setCallback(object : MqttCallbackExtended {
            override fun connectComplete(reconnect: Boolean, serverURI: String) {
                callback.onConnectionChanged(true)
            }

            override fun connectionLost(cause: Throwable?) {
                callback.onConnectionChanged(false, cause)
            }

            override fun messageArrived(topic: String, message: MqttMessage) {
                val payload = String(message.payload, Charsets.UTF_8)
                callback.onMessageArrived(topic, payload)
            }

            override fun deliveryComplete(token: IMqttDeliveryToken) {}
        })
    }

    /**
     * 建立 MQTT 连接
     */
    fun connect() {
        val options = MqttConnectOptions().apply {
            userName = MqttConfig.USERNAME                                         // 用户名
            password = MqttConfig.PASSWORD.toCharArray()                          // 密码
            isCleanSession = MqttConfig.CLEAN_SESSION                             // 缓存会话
            keepAliveInterval = MqttConfig.KEEP_ALIVE                             // 心跳间隔（秒）
            connectionTimeout = MqttConfig.CONNECTION_TIMEOUT                     // 连接超时（秒）
            isAutomaticReconnect = MqttConfig.AUTOMATIC_RECONNECT               // 断线自动重连
            maxReconnectDelay = MqttConfig.MAX_RECONNECT_DELAY                    // 最大重连延迟（秒）

            setWill(
                MqttTopics.TOPIC_DEVICE_OFFLINE,                                  // 遗嘱主题
                MqttConfig.WILL_PAYLOAD.toByteArray(),                             // 遗嘱消息
                MqttConfig.WILL_QOS,                                               // 遗嘱 QoS
                MqttConfig.WILL_RETAINED,                                          // 遗嘱保留
            )
        }
        client.connect(options)
    }

    /**
     * 断开 MQTT 连接
     */
    fun disconnect() {
        client.disconnect()
    }

    /**
     * 订阅主题
     *
     * @param topic MQTT 主题
     * @param qos   服务质量（0=最多一次，1=至少一次，2=恰好一次），默认 1
     */
    fun subscribe(topic: String, qos: Int = 1) {
        client.subscribe(topic, qos)
    }

    /**
     * 取消订阅主题
     *
     * @param topic MQTT 主题
     */
    fun unsubscribe(topic: String) {
        client.unsubscribe(topic)
    }

    /**
     * 发布消息
     *
     * @param topic    MQTT 主题
     * @param payload 消息内容
     * @param qos     服务质量（0=最多一次，1=至少一次，2=恰好一次），默认 1
     * @param retained 是否保留消息，默认 false
     */
    fun publish(topic: String, payload: String, qos: Int = 1, retained: Boolean = false) {
        client.publish(topic, MqttMessage().apply {
            this.payload = payload.toByteArray(Charsets.UTF_8)
            this.qos = qos
            this.isRetained = retained
        })
    }
}
