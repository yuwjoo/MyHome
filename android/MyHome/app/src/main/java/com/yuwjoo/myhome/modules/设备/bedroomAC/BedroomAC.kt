package com.yuwjoo.myhome.modules.设备.bedroomAC

import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.modules.mqtt.MqttManager
import com.yuwjoo.myhome.modules.mqtt.MqttTopicCallback
import com.yuwjoo.myhome.modules.udp.UdpManager
import com.yuwjoo.myhome.modules.udp.UdpTopicCallback
import org.json.JSONObject

class BedroomAC private constructor() {

    companion object {
        private val _instance: BedroomAC by lazy { BedroomAC().also { it.init() } }

        fun getInstance(): BedroomAC = _instance
    }

    private val callbacks = mutableListOf<ACStateCallback>()
    private var state = ACState()
    private val handler = Handler(Looper.getMainLooper())
    private var initialized = false

    val currentState: ACState
        get() = state

    private fun init() {
        if (initialized) return
        initialized = true

        // 订阅 MQTT 设备状态主题（retained 消息，QoS 0 即可）
        MqttManager.getInstance().subscribe(
            topic = BedroomACConfig.TOPIC_DEVICE,
            qos = 0,
            callback = object : MqttTopicCallback {
                override fun onMessageArrived(topic: String, payload: String) {
                    applyStateFromJson(payload)
                }
            }
        )

        // 订阅 UDP 设备状态主题
        UdpManager.getInstance().subscribe(
            topic = BedroomACConfig.TOPIC_DEVICE,
            callback = object : UdpTopicCallback {
                override fun onMessageArrived(topic: String, payload: Any?) {
                    applyStateFromPayload(payload)
                }
            }
        )
    }

    fun addCallback(callback: ACStateCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: ACStateCallback) {
        callbacks.remove(callback)
    }

    // ── 基本操作 ──

    fun togglePower()          = sendCommand("togglePower")
    fun increaseTemperature()  = sendCommand("increaseTemperature")
    fun decreaseTemperature()  = sendCommand("decreaseTemperature")
    fun toggleSwing()          = sendCommand("toggleSwing")
    fun setCoolingMode()       = sendCommand("setCoolingMode")
    fun setHeatingMode()       = sendCommand("setHeatingMode")
    fun setDryMode()           = sendCommand("setDryMode")
    fun setFanMode()           = sendCommand("setFanMode")
    fun toggleWindSpeed()      = sendCommand("toggleWindSpeed")
    fun enableGentleMode()     = sendCommand("enableGentleMode")
    fun toggleLight()          = sendCommand("toggleLight")

    // ── 定时操作 ──

    fun setOnTimer(minutes: Int) {
        val params = JSONObject().apply { put("minutes", minutes.coerceIn(0, 720)) }
        sendCommand("setOnTimer", params)
    }

    fun setOffTimer(minutes: Int) {
        val params = JSONObject().apply { put("minutes", minutes.coerceIn(0, 720)) }
        sendCommand("setOffTimer", params)
    }

    fun cancelOnTimer()  = sendCommand("cancelOnTimer")
    fun cancelOffTimer() = sendCommand("cancelOffTimer")

    // ── 消息收发 ──

    private fun sendCommand(action: String, params: JSONObject? = null) {
        // MQTT payload 格式：{"action":"togglePower","params":{...}}
        // UDP 需包装为：{"topic":"YHHome/RC/bedroomAC","data":{"action":"...","params":{...}}}
        val actionJson = JSONObject().apply {
            put("action", action)
            if (params != null) put("params", params)
        }

        val acDevice = UdpManager.getInstance().deviceList
            .find { it.deviceType == BedroomACConfig.DEVICE_TYPE }

        if (acDevice != null) {
            UdpManager.getInstance().publish(
                topic = BedroomACConfig.TOPIC_RC,
                payload = actionJson,
                targetIp = acDevice.ipAddress,
            )
        } else {
            MqttManager.getInstance().publish(
                topic = BedroomACConfig.TOPIC_RC,
                payload = actionJson.toString(),
                qos = 1,
            )
        }
    }

    // ── 状态解析 ──

    /**
     * 解析 MQTT 收到的 retained 状态 JSON
     * 格式：{"power":true,"mode":"cool","temperature":26,...}
     */
    private fun applyStateFromJson(jsonStr: String) {
        try {
            applyStateFromPayload(JSONObject(jsonStr))
        } catch (_: Exception) { }
    }

    /**
     * 解析 UDP 收到的状态 payload
     * UDP 格式：{"topic":"...","data":{"power":true,...}}
     * 需要先提取 data 字段
     */
    private fun applyStateFromPayload(payload: Any?) {
        val json = when (payload) {
            is JSONObject -> {
                // UDP 包装格式：有 data 字段则解包
                if (payload.has("data")) payload.getJSONObject("data") else payload
            }
            is String -> try { JSONObject(payload) } catch (_: Exception) { null }
            else -> null
        } ?: return

        val newState = ACState(
            power       = json.optBoolean("power", state.power),
            temperature = json.optInt("temperature", state.temperature),
            mode        = json.optString("mode", state.mode),
            swing       = json.optBoolean("swing", state.swing),
            windSpeed   = json.optString("windSpeed", state.windSpeed),
            gentle      = json.optBoolean("gentle", state.gentle),
            light       = json.optBoolean("light", state.light),
            onTimer     = json.optInt("onTimer", state.onTimer),
            offTimer    = json.optInt("offTimer", state.offTimer),
        )

        if (newState != state) {
            state = newState
            handler.post {
                callbacks.forEach { it.onStateChanged(state) }
            }
        }
    }
}
