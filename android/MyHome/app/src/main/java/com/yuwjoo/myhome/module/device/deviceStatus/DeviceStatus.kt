package com.yuwjoo.myhome.module.device.deviceStatus

import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.config.MqttTopics
import com.yuwjoo.myhome.module.mqtt.MqttManager
import com.yuwjoo.myhome.module.mqtt.callback.TopicCallback
import org.json.JSONObject

class DeviceStatus private constructor() {

    companion object {
        private val _instance: DeviceStatus by lazy { DeviceStatus().also { it.init() } }

        fun getInstance(): DeviceStatus = _instance
    }

    private val callbacks = mutableListOf<DeviceStatusCallback>()
    private var status = "unknown" // "online" | "offline" | "unknown"
    private val handler = Handler(Looper.getMainLooper())
    private var initialized = false

    val currentStatus: String
        get() = status

    private fun init() {
        if (initialized) return
        initialized = true

        // 订阅 MQTT 设备遗嘱主题（retained，新订阅者立即可获知当前状态）
        MqttManager.subscribe(
            topic = MqttTopics.TOPIC_DEVICE_OFFLINE,
            qos = 0,
            callback = object : TopicCallback {
                override fun onMessageArrived(topic: String, payload: String) {
                    try {
                        val json = JSONObject(payload)
                        val newStatus = json.optString("status", "unknown")

                        if (newStatus != status) {
                            status = newStatus
                            handler.post {
                                callbacks.forEach { it.onStatusChanged(status) }
                            }
                        }
                    } catch (_: Exception) { }
                }
            }
        )
    }

    fun addCallback(callback: DeviceStatusCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: DeviceStatusCallback) {
        callbacks.remove(callback)
    }
}
