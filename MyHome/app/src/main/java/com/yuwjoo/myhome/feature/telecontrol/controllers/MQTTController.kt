package com.yuwjoo.myhome.feature.telecontrol.controllers

import com.yuwjoo.myhome.MainActivity
import com.yuwjoo.myhome.common.bridge.BridgeConstant
import com.yuwjoo.myhome.feature.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.feature.telecontrol.utils.MQTTTConstant
import com.yuwjoo.myhome.feature.telecontrol.utils.ServerDeviceManager
import org.eclipse.paho.mqttv5.client.IMqttToken
import org.eclipse.paho.mqttv5.client.MqttAsyncClient
import org.eclipse.paho.mqttv5.client.MqttCallback
import org.eclipse.paho.mqttv5.client.MqttConnectionOptions
import org.eclipse.paho.mqttv5.client.MqttDisconnectResponse
import org.eclipse.paho.mqttv5.client.persist.MemoryPersistence
import org.eclipse.paho.mqttv5.common.MqttException
import org.eclipse.paho.mqttv5.common.MqttMessage
import org.eclipse.paho.mqttv5.common.packet.MqttProperties
import org.json.JSONObject
import java.util.UUID

/**
 * mqtt控制器
 */
object MQTTController {

    private const val TAG = "MQTTConnect"
    private const val MQTT_SERVER_URI = "tcp://47.115.161.79:1883" // MQTT服务器地址
    private const val MQTT_USERNAME = "my-home" // 用户名
    private const val MQTT_PASSWORD = "my-home" // 密码
    private const val MQTT_DEFAULT_QOS = 1 // 默认消息模式
    private val clientId = UUID.randomUUID().toString() // 客户端id
    private var mqttAsyncClient: MqttAsyncClient? = null // mqtt客户端实例

    val isConnected: Boolean get() = mqttAsyncClient?.isConnected ?: false // mqtt是否连接

    /**
     * 开始连接
     */
    fun connect() {
        if (isConnected) return
        if (mqttAsyncClient == null) {
            // 创建客户端
            mqttAsyncClient = MqttAsyncClient(MQTT_SERVER_URI, clientId, MemoryPersistence())
            // 设置回调
            mqttAsyncClient!!.setCallback(object : MqttCallback {

                /**
                 * MQTT连接完成
                 */
                override fun connectComplete(reconnect: Boolean, serverURI: String) {
                    // 订阅卧室空调状态主题
                    mqttAsyncClient!!.subscribe(
                        MQTTTConstant.TOPIC_DEVICE_BEDROOM_AC,
                        MQTT_DEFAULT_QOS
                    )
                    // 订阅服务设备信息主题
                    mqttAsyncClient!!.subscribe(
                        MQTTTConstant.TOPIC_SERVER_DEVICES,
                        MQTT_DEFAULT_QOS
                    )
                    // 同步状态到web端
                    syncMqttState()
                }

                /**
                 * MQTT断开连接
                 */
                override fun disconnected(disconnectResponse: MqttDisconnectResponse) {
                    // 同步状态到web端
                    syncMqttState()
                }

                /**
                 * 收到MQTT消息
                 */
                override fun messageArrived(topic: String, message: MqttMessage) {
                    // 监听消息
                    onMessage(topic, message)
                }

                /**
                 * MQTT消息发送完成
                 */
                override fun deliveryComplete(token: IMqttToken) {}

                /**
                 * 认证包到达
                 */
                override fun authPacketArrived(reasonCode: Int, properties: MqttProperties) {}

                /**
                 * MQTT错误
                 */
                override fun mqttErrorOccurred(exception: MqttException) {}
            })
        }

        // 进行连接
        mqttAsyncClient!!.connect(MqttConnectionOptions().apply {
            userName = MQTT_USERNAME
            password = MQTT_PASSWORD.toByteArray()
            isCleanStart = false // 保持会话状态
            connectionTimeout = 60 // 连接超时时间（秒）
            keepAliveInterval = 30 // 心跳间隔（秒）
            isAutomaticReconnect = true // 自动重连
        })
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        mqttAsyncClient?.disconnect()
    }

    /**
     * 关闭连接
     */
    fun close() {
        mqttAsyncClient?.close()
    }

    /**
     * 发送消息
     * @param topic 消息主题
     * @param message 消息内容
     * @param qos QoS级别
     * @param retained 是否保留消息
     */
    fun sendMessage(
        topic: String,
        message: String? = null,
        qos: Int = MQTT_DEFAULT_QOS,
        retained: Boolean = false
    ) {
        val mqttMessage = MqttMessage(message?.toByteArray()).apply {
            this.qos = qos
            this.isRetained = retained
        }
        mqttAsyncClient?.publish(topic, mqttMessage)
    }

    /**
     * 监听消息
     * @param topic 主题
     * @param message 消息
     */
    private fun onMessage(topic: String, message: MqttMessage) {
        when (topic) {
            // 卧室空调状态改变
            MQTTTConstant.TOPIC_DEVICE_BEDROOM_AC -> {
                BedroomAC.syncACState(String(message.payload))
            }
            // 收到服务设备信息
            MQTTTConstant.TOPIC_SERVER_DEVICES -> {
                ServerDeviceManager.update(JSONObject(String(message.payload)))
            }
        }
    }

    /**
     * 同步MQTT连接状态
     */
    private fun syncMqttState() {
        MainActivity.instance?.apply {
            homeWebView.channel.send(
                BridgeConstant.EVENT_SYNC_MQTT_STATE,
                isConnected
            )
        }
    }
}