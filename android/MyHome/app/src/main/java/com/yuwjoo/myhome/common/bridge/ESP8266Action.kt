package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.esp8266.ESP8266
import com.yuwjoo.myhome.common.device.esp8266.ESP8266Callback
import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import org.json.JSONObject

class ESP8266Action : MessageAction {
    override val name = "deviceStatus"

    private var statusCallback: ESP8266Callback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")

        when (action) {
            // 获取设备状态
            "getStatus" -> {
                helper.invokeCallback(groupId, "onStatus", ESP8266.status.toJson())
            }
            // 订阅状态变更
            "subscribeStatus" -> {
                if (statusCallback == null) {
                    statusCallback = ESP8266Callback { state ->
                        helper.pushEvent("onDeviceStatusChanged", state.toJson())
                    }
                    ESP8266.registerStatusListener(statusCallback!!)
                }
            }
            // 取消订阅
            "unsubscribeStatus" -> {
                statusCallback?.let { ESP8266.unregisterStatusListener(it) }
                statusCallback = null
            }
        }
    }
}
