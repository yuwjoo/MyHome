/**
 * 卧室空调遥控器消息处理
 */
package com.yuwjoo.myhome.module.bridge.handlers

import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import com.yuwjoo.myhome.module.device.bedroomAC.ACState
import com.yuwjoo.myhome.module.device.bedroomAC.ACStateCallback
import com.yuwjoo.myhome.module.device.bedroomAC.BedroomAC
import org.json.JSONObject

class BedroomACAction : MessageAction {
    override val name = "bedroomAC"

    private var stateCallback: ACStateCallback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")
        val ac = BedroomAC.getInstance()

        when (action) {
            "togglePower" -> ac.togglePower()
            "increaseTemperature" -> ac.increaseTemperature()
            "decreaseTemperature" -> ac.decreaseTemperature()
            "toggleSwing" -> ac.toggleSwing()
            "setCoolingMode" -> ac.setCoolingMode()
            "setHeatingMode" -> ac.setHeatingMode()
            "setDryMode" -> ac.setDryMode()
            "setFanMode" -> ac.setFanMode()
            "toggleWindSpeed" -> ac.toggleWindSpeed()
            "enableGentleMode" -> ac.enableGentleMode()
            "toggleLight" -> ac.toggleLight()
            "setOnTimer" -> {
                val minutes = params.getInt("minutes")
                ac.setOnTimer(minutes)
            }
            "setOffTimer" -> {
                val minutes = params.getInt("minutes")
                ac.setOffTimer(minutes)
            }
            "cancelOnTimer" -> ac.cancelOnTimer()
            "cancelOffTimer" -> ac.cancelOffTimer()
            "getState" -> {
                helper.invokeCallback(groupId, "onState", stateToJson(ac.currentState))
            }
            "subscribeState" -> {
                if (stateCallback == null) {
                    stateCallback = object : ACStateCallback {
                        override fun onStateChanged(state: ACState) {
                            helper.pushEvent("onACStateChanged", stateToJson(state))
                        }
                    }
                    ac.addCallback(stateCallback!!)
                }
            }
            "unsubscribeState" -> {
                stateCallback?.let { ac.removeCallback(it) }
                stateCallback = null
            }
        }
    }

    private fun stateToJson(state: ACState): JSONObject {
        return JSONObject().apply {
            put("power", state.power)
            put("temperature", state.temperature)
            put("mode", state.mode)
            put("swing", state.swing)
            put("windSpeed", state.windSpeed)
            put("gentle", state.gentle)
            put("light", state.light)
            put("onTimer", state.onTimer)
            put("offTimer", state.offTimer)
        }
    }
}
