package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.esp8266.ESP8266
import com.yuwjoo.myhome.common.device.esp8266.ESP8266Callback
import com.yuwjoo.myhome.common.topic.payload.DataESP8266Payload
import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import org.json.JSONObject

class ESP8266Action : MessageAction {
    override val name = "deviceStatus"

    private var statusCallback: ESP8266Callback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")

        when (action) {
            "getStatus" -> {
                helper.invokeCallback(groupId, "onStatus", statusToJson(ESP8266.status))
            }
            "subscribeStatus" -> {
                if (statusCallback == null) {
                    statusCallback = ESP8266Callback { state ->
                        helper.pushEvent("onDeviceStatusChanged", statusToJson(state))
                    }
                    ESP8266.registerStatusListener(statusCallback!!)
                }
            }
            "unsubscribeStatus" -> {
                statusCallback?.let { ESP8266.unregisterStatusListener(it) }
                statusCallback = null
            }
        }
    }

    private fun statusToJson(state: DataESP8266Payload): JSONObject {
        return JSONObject().apply {
            put("isOnline", state.isOnline)
            put("updateTime", state.updateTime)
        }
    }
}
