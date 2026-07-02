package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.tempHumidSensor.TempHumidSensor
import com.yuwjoo.myhome.common.device.tempHumidSensor.TempHumidSensorCallback
import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import org.json.JSONObject

class TempHumidAction : MessageAction {
    override val name = "tempHumid"

    private var stateCallback: TempHumidSensorCallback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")

        when (action) {
            // 获取温湿度
            "getState" -> {
                helper.invokeCallback(groupId, "onState", TempHumidSensor.sensorState.toJson())
            }
            // 订阅数据变更
            "subscribeState" -> {
                if (stateCallback == null) {
                    stateCallback = TempHumidSensorCallback { state ->
                        helper.pushEvent("onTempHumidChanged", state.toJson())
                    }
                    TempHumidSensor.registerSensorListener(stateCallback!!)
                }
            }
            // 取消订阅
            "unsubscribeState" -> {
                stateCallback?.let { TempHumidSensor.unregisterSensorListener(it) }
                stateCallback = null
            }
        }
    }
}
