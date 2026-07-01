package com.yuwjoo.myhome.module.device.tempHumid

import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.config.MqttTopics
import com.yuwjoo.myhome.module.mqtt.MqttManager
import com.yuwjoo.myhome.module.mqtt.callback.TopicCallback
import org.json.JSONObject

class TempHumidSensor private constructor() {

    companion object {
        private val _instance: TempHumidSensor by lazy { TempHumidSensor().also { it.init() } }

        fun getInstance(): TempHumidSensor = _instance
    }

    private val callbacks = mutableListOf<TempHumidCallback>()
    private var state = TempHumidState()
    private val handler = Handler(Looper.getMainLooper())
    private var initialized = false

    val currentState: TempHumidState
        get() = state

    private fun init() {
        if (initialized) return
        initialized = true

        // 订阅 MQTT 温湿度主题（retained 消息，QoS 0 即可）
        MqttManager.subscribe(
            topic = MqttTopics.TOPIC_TEMP_HUMID,
            qos = 0,
            callback = object : TopicCallback {
                override fun onMessageArrived(topic: String, payload: String) {
                    applyStateFromJson(payload)
                }
            }
        )
    }

    fun addCallback(callback: TempHumidCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: TempHumidCallback) {
        callbacks.remove(callback)
    }

    /**
     * 解析 MQTT 收到的 retained 温湿度 JSON
     * 格式：{"temperature":26.0,"humidity":58.0}
     */
    private fun applyStateFromJson(jsonStr: String) {
        try {
            val json = JSONObject(jsonStr)
            val temperature = json.optDouble("temperature", state.temperature.toDouble()).toFloat()
            val humidity = json.optDouble("humidity", state.humidity.toDouble()).toFloat()

            val newState = TempHumidState(temperature, humidity)

            if (newState != state) {
                state = newState
                handler.post {
                    callbacks.forEach { it.onStateChanged(state) }
                }
            }
        } catch (_: Exception) { }
    }
}
