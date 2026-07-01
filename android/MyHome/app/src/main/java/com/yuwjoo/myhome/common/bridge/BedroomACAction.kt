package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.bedroomAC.ACStateCallback
import com.yuwjoo.myhome.common.device.bedroomAC.BedroomAC
import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import org.json.JSONObject

class BedroomACAction : MessageAction {
    override val name = "bedroomAC"

    private var stateCallback: ACStateCallback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")

        when (action) {
            "togglePower" -> BedroomAC.togglePower()
            "increaseTemperature" -> BedroomAC.increaseTemperature()
            "decreaseTemperature" -> BedroomAC.decreaseTemperature()
            "toggleSwing" -> BedroomAC.toggleSwing()
            "setCoolingMode" -> BedroomAC.setCoolingMode()
            "setHeatingMode" -> BedroomAC.setHeatingMode()
            "setDryMode" -> BedroomAC.setDryMode()
            "setFanMode" -> BedroomAC.setFanMode()
            "toggleWindSpeed" -> BedroomAC.toggleWindSpeed()
            "enableGentleMode" -> BedroomAC.enableGentleMode()
            "toggleLight" -> BedroomAC.toggleLight()
            "setOnTimer" -> {
                val minutes = params.getInt("minutes")
                BedroomAC.setOnTimer(minutes)
            }

            "setOffTimer" -> {
                val minutes = params.getInt("minutes")
                BedroomAC.setOffTimer(minutes)
            }

            "cancelOnTimer" -> BedroomAC.cancelOnTimer()
            "cancelOffTimer" -> BedroomAC.cancelOffTimer()
            "getState" -> {
                helper.invokeCallback(groupId, "onState", BedroomAC.acState.toJson())
            }

            "subscribeState" -> {
                if (stateCallback == null) {
                    stateCallback = ACStateCallback { state ->
                        helper.pushEvent("onACStateChanged", state.toJson())
                    }
                    BedroomAC.registerACStateListener(stateCallback!!)
                }
            }

            "unsubscribeState" -> {
                stateCallback?.let { BedroomAC.unregisterACStateListener(it) }
                stateCallback = null
            }
        }
    }
}
