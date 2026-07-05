package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.esp8266.ESP8266Device
import com.yuwjoo.myhome.common.device.esp8266.ESP8266Callback
import com.yuwjoo.myhome.module.bridge.annotation.BridgeGroup
import com.yuwjoo.myhome.module.bridge.annotation.BridgeMessage
import com.yuwjoo.myhome.module.bridge.core.MessageSender
import org.json.JSONObject

/**
 * ESP8266 设备分组
 */
@BridgeGroup("deviceStatus")
class ESP8266Group {

    private var statusCallback: ESP8266Callback? = null

    /**
     * 设备在线状态事件处理，根据 action 订阅或取消状态监听
     *
     * @param params 包含 action 字段 ("on" / "off") 的 JSON 对象
     */
    @BridgeMessage("deviceStatus")
    fun deviceStatus(params: JSONObject, sender: MessageSender) {
        val action = params.getString("action")

        when (action) {
            "on" -> {
                sender.send("onDeviceStatus", JSONObject(ESP8266Device.status.toJson()), isRetained = true)
                if (statusCallback == null) {
                    statusCallback = ESP8266Callback { state ->
                        sender.send("onDeviceStatus", JSONObject(state.toJson()), isRetained = true)
                    }
                    ESP8266Device.registerStatusListener(statusCallback!!)
                }
            }
            "off" -> {
                statusCallback?.let { ESP8266Device.unregisterStatusListener(it) }
                statusCallback = null
            }
        }
    }
}
