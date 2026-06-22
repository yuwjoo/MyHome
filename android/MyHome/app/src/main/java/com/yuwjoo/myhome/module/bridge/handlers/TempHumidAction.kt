/**
 * 温湿度传感器消息处理
 */
package com.yuwjoo.myhome.module.bridge.handlers

import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import com.yuwjoo.myhome.module.device.tempHumid.TempHumidCallback
import com.yuwjoo.myhome.module.device.tempHumid.TempHumidSensor
import com.yuwjoo.myhome.module.device.tempHumid.TempHumidState
import org.json.JSONObject

class TempHumidAction : MessageAction {
    override val name = "tempHumid"

    private var stateCallback: TempHumidCallback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")
        val sensor = TempHumidSensor.getInstance()

        when (action) {
            "getState" -> {
                helper.invokeCallback(groupId, "onState", stateToJson(sensor.currentState))
            }
            "subscribeState" -> {
                if (stateCallback == null) {
                    stateCallback = object : TempHumidCallback {
                        override fun onStateChanged(state: TempHumidState) {
                            helper.pushEvent("onTempHumidChanged", stateToJson(state))
                        }
                    }
                    sensor.addCallback(stateCallback!!)
                }
            }
            "unsubscribeState" -> {
                stateCallback?.let { sensor.removeCallback(it) }
                stateCallback = null
            }
        }
    }

    private fun stateToJson(state: TempHumidState): JSONObject {
        return JSONObject().apply {
            put("temperature", state.temperature.toDouble())
            put("humidity", state.humidity.toDouble())
        }
    }
}
