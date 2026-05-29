package com.yuwjoo.myhome.common.telecontrol

import android.util.Log
import com.yuwjoo.myhome.activity.main.ui.webview.BridgeConstant
import com.yuwjoo.myhome.activity.main.ui.webview.getBridge
import com.yuwjoo.myhome.common.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.common.telecontrol.utils.TelecontrolHelper
import org.eclipse.paho.mqttv5.client.IMqttToken
import org.eclipse.paho.mqttv5.client.MqttAsyncClient
import org.eclipse.paho.mqttv5.client.MqttCallback
import org.eclipse.paho.mqttv5.client.MqttConnectionOptions
import org.eclipse.paho.mqttv5.client.MqttDisconnectResponse
import org.eclipse.paho.mqttv5.client.persist.MemoryPersistence
import org.eclipse.paho.mqttv5.common.MqttException
import org.eclipse.paho.mqttv5.common.MqttMessage
import org.eclipse.paho.mqttv5.common.packet.MqttProperties
import java.util.*

/**
 * MQTT遥控
 */
class MQTTTelecontrol private constructor() {

    companion object {
        private const val TAG = "MQTTConnect"

        private const val MQTT_SERVER_URI = "tcp://47.115.161.79:1883" // MQTT服务器地址
        private const val MQTT_USERNAME = "my-home" // 用户名
        private const val MQTT_PASSWORD = "my-home" // 密码
        private const val MQTT_DEFAULT_QOS = 1 // 默认消息模式

        @Volatile
        private var instance: MQTTTelecontrol? = null

        /**
         * 获取单例实例
         * @return mqtt连接类实例
         */
        fun getInstance(): MQTTTelecontrol {
            if (instance == null) {
                synchronized(MQTTTelecontrol::class.java) {
                    if (instance == null) {
                        instance = MQTTTelecontrol()
                    }
                }
            }
            return instance!!
        }
    }

    private val mqttAsyncClient: MqttAsyncClient // mqtt客户端实例
    private val clientId: String = UUID.randomUUID().toString() // 客户端id

    init {
        // 创建客户端
        mqttAsyncClient = MqttAsyncClient(MQTT_SERVER_URI, clientId, MemoryPersistence())
        // 设置回调
        mqttAsyncClient.setCallback(object : MqttCallback {
            /**
             * MQTT断开连接
             */
            override fun disconnected(disconnectResponse: MqttDisconnectResponse) {
                // 连接状态改变
                getBridge()?.globalChannel?.send(BridgeConstant.EVENT_MQTT_CONNECT_STATE, false)
            }

            /**
             * MQTT错误
             */
            override fun mqttErrorOccurred(exception: MqttException) {}

            /**
             * 收到MQTT消息
             */
            override fun messageArrived(topic: String, message: MqttMessage) {
                when (topic) {
                    // 卧室空调状态改变
                    TelecontrolHelper.TOPIC_DEVICE_BEDROOM_AC -> {
                        BedroomAC.updateACState(String(message.payload))
                    }
                }
            }

            /**
             * MQTT消息发送完成
             */
            override fun deliveryComplete(token: IMqttToken) {}

            /**
             * MQTT连接完成
             */
            override fun connectComplete(reconnect: Boolean, serverURI: String) {
                subscribe(TelecontrolHelper.TOPIC_DEVICE_BEDROOM_AC)
                // 连接状态改变
                getBridge()?.globalChannel?.send(BridgeConstant.EVENT_MQTT_CONNECT_STATE, true)
            }

            /**
             * 认证包到达
             */
            override fun authPacketArrived(reasonCode: Int, properties: MqttProperties) {}
        })
    }

    /**
     * MQTT客户端ID
     * @return 客户端ID
     */
    fun getClientId(): String {
        return clientId
    }

    /**
     * MQTT连接状态
     * @return 是否已连接到MQTT服务器
     */
    fun isConnected(): Boolean {
        return mqttAsyncClient.isConnected
    }

    /**
     * 连接到MQTT服务器
     * @return 是否成功开始连接过程
     */
    fun connect(): Boolean {
        disconnect()
        // 创建连接选项
        val token = mqttAsyncClient.connect(MqttConnectionOptions().apply {
            userName = MQTT_USERNAME
            password = MQTT_PASSWORD.toByteArray()
            isCleanStart = false // 保持会话状态
            connectionTimeout = 60 // 连接超时时间（秒）
            keepAliveInterval = 30 // 心跳间隔（秒）
            isAutomaticReconnect = true // 自动重连
        })
        token.waitForCompletion(5000) // 等待连接完成，最多5秒

        return mqttAsyncClient.isConnected
    }

    /**
     * 断开与MQTT服务器的连接
     */
    fun disconnect() {
        if (!mqttAsyncClient.isConnected) return
        mqttAsyncClient.disconnect()
        mqttAsyncClient.close()
    }

    /**
     * 订阅MQTT主题
     * @param topic 要订阅的主题
     * @param qos QoS级别，如果为null则使用默认值
     * @return 是否订阅成功
     */
    fun subscribe(topic: String, qos: Int? = null): Boolean {
        try {
            if (!mqttAsyncClient.isConnected) {
                return false
            }

            val qosValue = qos ?: MQTT_DEFAULT_QOS
            val token = mqttAsyncClient.subscribe(topic, qosValue)
            token.waitForCompletion()
            return true
        } catch (e: MqttException) {
            Log.e(TAG, "订阅主题失败: ${e.message}", e)
            return false
        }
    }

    /**
     * 取消订阅MQTT主题
     * @param topic 要取消订阅的主题
     * @return 是否取消订阅成功
     */
    fun unsubscribe(topic: String): Boolean {
        try {
            if (!mqttAsyncClient.isConnected) {
                return false
            }

            val token = mqttAsyncClient.unsubscribe(topic)
            token.waitForCompletion()

            Log.d(TAG, "已取消订阅主题: $topic")
            return true
        } catch (e: MqttException) {
            Log.e(TAG, "取消订阅主题失败: ${e.message}", e)
            return false
        }
    }

    /**
     * 发布MQTT消息
     * @param topic 消息主题，如果为null则使用默认主题
     * @param message 消息内容
     * @param qos QoS级别，如果为null则使用默认值
     * @param retained 是否保留消息
     * @return 是否发布成功
     */
    fun publish(
        topic: String,
        message: String,
        qos: Int? = null,
        retained: Boolean = false
    ): Boolean {
        try {
            if (!mqttAsyncClient.isConnected) {
                return false
            }

            val qosValue = qos ?: MQTT_DEFAULT_QOS
            val mqttMessage = MqttMessage(message.toByteArray()).apply {
                this.qos = qosValue
                this.isRetained = retained
            }
            val token = mqttAsyncClient.publish(topic, mqttMessage)
            token.waitForCompletion()

            return true
        } catch (e: MqttException) {
            Log.e(TAG, "发布消息失败: ${e.message}", e)
            return false
        }
    }
}