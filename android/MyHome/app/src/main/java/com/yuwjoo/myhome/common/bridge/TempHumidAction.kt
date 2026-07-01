package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.tempHumidSensor.TempHumidSensor
import com.yuwjoo.myhome.common.device.tempHumidSensor.TempHumidSensorCallback
import com.yuwjoo.myhome.common.topic.payload.DataTempHumidSensorPayload
import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import org.json.JSONObject

class TempHumidAction : MessageAction {
    override val name = "tempHumid"

    private var stateCallback: TempHumidSensorCallback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")

        when (action) {
            "getState" -> {
                helper.invokeCallback(groupId, "onState", stateToJson(TempHumidSensor.sensorState))
            }
            "subscribeState" -> {
                if (stateCallback == null) {
                    stateCallback = TempHumidSensorCallback { state ->
                        helper.pushEvent("onTempHumidChanged", stateToJson(state))
                    }
                    TempHumidSensor.registerSensorListener(stateCallback!!)
                }
            }
            "unsubscribeState" -> {
                stateCallback?.let { TempHumidSensor.unregisterSensorListener(it) }
                stateCallback = null
            }
        }
    }

    private fun stateToJson(state: DataTempHumidSensorPayload): JSONObject {
        return JSONObject().apply {
            put("temperature", state.temperature.toDouble())
            put("humidity", state.humidity.toDouble())
        }
    }
}
