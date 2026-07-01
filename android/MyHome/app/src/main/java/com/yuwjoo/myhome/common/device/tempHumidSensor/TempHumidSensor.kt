package com.yuwjoo.myhome.common.device.tempHumidSensor

import com.yuwjoo.myhome.common.topic.DataTempHumidSensorTopic
import com.yuwjoo.myhome.common.topic.payload.DataTempHumidSensorPayload
import com.yuwjoo.myhome.module.mqtt.MqttManager
import com.yuwjoo.myhome.module.mqtt.TopicCallback

/**
 * 温湿度传感器设备
 */
object TempHumidSensor {

    // 传感器状态监听器集合
    private val sensorListeners = LinkedHashSet<TempHumidSensorCallback>()

    // 当前传感器数据
    val sensorState = DataTempHumidSensorPayload()

    init {
        MqttManager.subscribe(
            topic = DataTempHumidSensorTopic.topic,
            qos = DataTempHumidSensorTopic.qos,
            callback = TopicCallback { _, payload -> applyState(payload) }
        )
    }

    /**
     * 注册传感器状态监听器
     *
     * @param listener 状态回调
     */
    fun registerSensorListener(listener: TempHumidSensorCallback) {
        sensorListeners.add(listener)
    }

    /**
     * 移除传感器状态监听器
     *
     * @param listener 要移除的回调
     */
    fun unregisterSensorListener(listener: TempHumidSensorCallback) {
        sensorListeners.remove(listener)
    }

    /**
     * 解析 MQTT 收到的 retained 温湿度 JSON
     *
     * @param jsonStr MQTT 消息内容
     */
    private fun applyState(jsonStr: String) {
        sensorState.fromJson(jsonStr)
        sensorListeners.forEach { it.onStateChanged(sensorState) }
    }
}
