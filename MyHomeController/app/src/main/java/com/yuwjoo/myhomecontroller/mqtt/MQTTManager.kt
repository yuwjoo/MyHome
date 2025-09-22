package com.yuwjoo.myhomecontroller.mqtt

import android.util.Log
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
 * MQTT客户端管理器，负责MQTT连接的建立、维护和相关操作
 * 将MQTT相关功能从服务中分离出来，实现更好的代码组织和复用
 */
class MQTTManager {

    companion object {
        private const val TAG = "MQTTManager"
    }

    private var mqttAsyncClient: MqttAsyncClient? = null
    private var clientId: String? = null
    private var serverUri: String = ""
    private var username: String = ""
    private var password: String = ""
    private var defaultQos: Int = 1
    private var connectionCallback: MQTTConnectionCallback? = null
    private var messageCallback: MQTTMessageCallback? = null

    /**
     * 初始化MQTT管理器
     * @param serverUri MQTT服务器地址，格式为：tcp://host:port
     * @param username 用户名
     * @param password 密码
     * @param defaultQos 默认的QoS级别（0、1、2）
     */
    fun init(
        serverUri: String,
        username: String,
        password: String,
        defaultQos: Int = 1
    ) {
        this.serverUri = serverUri
        this.username = username
        this.password = password
        this.defaultQos = defaultQos
        this.clientId = UUID.randomUUID().toString() // 使用随机UUID作为客户端ID
    }

    /**
     * 设置连接回调接口
     * @param callback 连接状态变化的回调
     */
    fun setConnectionCallback(callback: MQTTConnectionCallback) {
        this.connectionCallback = callback
    }

    /**
     * 设置消息接收回调接口
     * @param callback 接收到消息的回调
     */
    fun setMessageCallback(callback: MQTTMessageCallback) {
        this.messageCallback = callback
    }

    /**
     * 连接到MQTT服务器
     * @return 是否成功开始连接过程
     */
    fun connect(): Boolean {
        try {
            // 检查是否已初始化必要参数
            if (serverUri.isEmpty() || username.isEmpty() || clientId == null) {
                Log.e(TAG, "MQTT参数未初始化，请先调用init方法")
                return false
            }

            // 释放之前的连接（如果存在）
            disconnect()

            // 创建持久化存储
            val persistence = MemoryPersistence()
            
            // 创建MQTT客户端
            mqttAsyncClient = MqttAsyncClient(serverUri, clientId, persistence)
            
            // 设置回调
            mqttAsyncClient?.setCallback(object : MqttCallback {
                override fun disconnected(disconnectResponse: MqttDisconnectResponse) {
                    Log.d(TAG, "已断开连接: $disconnectResponse")
                    connectionCallback?.onDisconnected(disconnectResponse)
                }

                override fun mqttErrorOccurred(exception: MqttException) {
                    Log.e(TAG, "MQTT错误: ${exception.message}")
                    connectionCallback?.onError(exception)
                }

                override fun messageArrived(topic: String, message: MqttMessage) {
                    val messageContent = String(message.payload)
                    Log.d(TAG, "收到消息 - 主题: $topic, 消息: $messageContent, QoS: ${message.qos}")
                    messageCallback?.onMessageReceived(topic, messageContent, message.qos)
                }

                override fun deliveryComplete(token: IMqttToken) {
                    Log.d(TAG, "消息发送完成")
                    connectionCallback?.onDeliveryComplete(token)
                }

                override fun connectComplete(reconnect: Boolean, serverURI: String) {
                    Log.d(TAG, "连接完成 - 是否重连: $reconnect, 服务器URI: $serverURI")
                    connectionCallback?.onConnectComplete(reconnect, serverURI)
                }

                override fun authPacketArrived(reasonCode: Int, properties: MqttProperties) {
                    Log.d(TAG, "认证包到达 - 原因码: $reasonCode, 属性: $properties")
                }
            })

            // 创建连接选项
            val connectionOptions = MqttConnectionOptions().apply {
                userName = this@MQTTManager.username
                password = this@MQTTManager.password.toByteArray()
                isCleanStart = false // 保持会话状态
                connectionTimeout = 60 // 连接超时时间（秒）
                keepAliveInterval = 30 // 心跳间隔（秒）
                isAutomaticReconnect = true // 自动重连
            }

            // 开始连接
            val token = mqttAsyncClient?.connect(connectionOptions)
            token?.waitForCompletion(5000) // 等待连接完成，最多5秒

            val isConnected = mqttAsyncClient?.isConnected ?: false
            Log.d(TAG, "连接结果: $isConnected")
            
            return isConnected

        } catch (e: MqttException) {
            Log.e(TAG, "MQTT连接异常: ${e.message}", e)
            connectionCallback?.onError(e)
            return false
        } catch (e: Exception) {
            Log.e(TAG, "连接异常: ${e.message}", e)
            return false
        }
    }

    /**
     * 断开与MQTT服务器的连接
     */
    fun disconnect() {
        try {
            if (mqttAsyncClient != null && mqttAsyncClient!!.isConnected) {
                mqttAsyncClient?.disconnect()
                mqttAsyncClient?.close()
                Log.d(TAG, "已断开MQTT连接")
            }
            mqttAsyncClient = null
        } catch (e: MqttException) {
            Log.e(TAG, "断开连接异常: ${e.message}", e)
        }
    }

    /**
     * 订阅MQTT主题
     * @param topic 要订阅的主题
     * @param qos QoS级别，如果为null则使用默认值
     * @return 是否订阅成功
     */
    fun subscribe(topic: String, qos: Int? = null): Boolean {
        try {
            if (mqttAsyncClient == null || !mqttAsyncClient!!.isConnected) {
                Log.e(TAG, "MQTT未连接，无法订阅主题")
                return false
            }

            val qosValue = qos ?: defaultQos
            val token = mqttAsyncClient?.subscribe(topic, qosValue)
            token?.waitForCompletion()
            
            Log.d(TAG, "已订阅主题: $topic, QoS: $qosValue")
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
            if (mqttAsyncClient == null || !mqttAsyncClient!!.isConnected) {
                Log.e(TAG, "MQTT未连接，无法取消订阅主题")
                return false
            }

            val token = mqttAsyncClient?.unsubscribe(topic)
            token?.waitForCompletion()
            
            Log.d(TAG, "已取消订阅主题: $topic")
            return true
        } catch (e: MqttException) {
            Log.e(TAG, "取消订阅主题失败: ${e.message}", e)
            return false
        }
    }

    /**
     * 发布MQTT消息
     * @param topic 消息主题
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
            if (mqttAsyncClient == null || !mqttAsyncClient!!.isConnected) {
                Log.e(TAG, "MQTT未连接，无法发布消息")
                return false
            }

            val qosValue = qos ?: defaultQos
            val mqttMessage = MqttMessage(message.toByteArray()).apply {
                this.qos = qosValue
                this.isRetained = retained
            }

            val token = mqttAsyncClient?.publish(topic, mqttMessage)
            token?.waitForCompletion()
            
            Log.d(TAG, "已发布消息 - 主题: $topic, 消息: $message, QoS: $qosValue")
            return true
        } catch (e: MqttException) {
            Log.e(TAG, "发布消息失败: ${e.message}", e)
            return false
        }
    }

    /**
     * 检查MQTT连接状态
     * @return 是否已连接到MQTT服务器
     */
    fun isConnected(): Boolean {
        return mqttAsyncClient?.isConnected ?: false
    }

    /**
     * 获取当前的MQTT客户端ID
     * @return 客户端ID
     */
    fun getClientId(): String? {
        return clientId
    }

    /**
     * MQTT连接状态回调接口
     */
    interface MQTTConnectionCallback {
        /**
         * 连接完成回调
         * @param reconnect 是否是重连
         * @param serverURI 服务器URI
         */
        fun onConnectComplete(reconnect: Boolean, serverURI: String)

        /**
         * 断开连接回调
         * @param disconnectResponse 断开连接响应
         */
        fun onDisconnected(disconnectResponse: MqttDisconnectResponse)

        /**
         * 消息发送完成回调
         * @param token 消息令牌
         */
        fun onDeliveryComplete(token: IMqttToken)

        /**
         * 错误回调
         * @param exception 异常信息
         */
        fun onError(exception: Exception)
    }

    /**
     * MQTT消息接收回调接口
     */
    interface MQTTMessageCallback {
        /**
         * 收到消息回调
         * @param topic 消息主题
         * @param message 消息内容
         * @param qos QoS级别
         */
        fun onMessageReceived(topic: String, message: String, qos: Int)
    }
}