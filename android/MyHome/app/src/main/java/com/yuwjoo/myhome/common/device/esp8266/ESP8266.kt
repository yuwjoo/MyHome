package com.yuwjoo.myhome.common.device.esp8266

import com.yuwjoo.myhome.common.topic.DataESP8266Topic
import com.yuwjoo.myhome.common.topic.payload.DataESP8266Payload
import com.yuwjoo.myhome.module.mqtt.MqttManager
import com.yuwjoo.myhome.module.mqtt.TopicCallback

/**
 * ESP8266 设备
 */
object ESP8266 {

    // 设备状态监听器集合
    private val statusListeners = LinkedHashSet<ESP8266Callback>()

    // 当前设备状态
    val status = DataESP8266Payload()

    init {
        MqttManager.subscribe(
            topic = DataESP8266Topic.topic,
            qos = DataESP8266Topic.qos,
            callback = TopicCallback { _, payload -> applyStatus(payload) }
        )
    }

    /**
     * 注册设备状态监听器
     *
     * @param listener 状态回调
     */
    fun registerStatusListener(listener: ESP8266Callback) {
        statusListeners.add(listener)
    }

    /**
     * 移除设备状态监听器
     *
     * @param listener 要移除的回调
     */
    fun unregisterStatusListener(listener: ESP8266Callback) {
        statusListeners.remove(listener)
    }

    /**
     * 解析 MQTT 收到的 retained 状态 JSON
     *
     * @param jsonStr MQTT 消息内容
     */
    private fun applyStatus(jsonStr: String) {
        status.fromJson(jsonStr)
        statusListeners.forEach { it.onStatusChanged(status) }
    }
}
