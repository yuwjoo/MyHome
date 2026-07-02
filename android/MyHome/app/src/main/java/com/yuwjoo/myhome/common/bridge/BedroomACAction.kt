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
            // 开关机
            "togglePower" -> BedroomAC.togglePower()
            // 温度 +1
            "increaseTemperature" -> BedroomAC.increaseTemperature()
            // 温度 -1
            "decreaseTemperature" -> BedroomAC.decreaseTemperature()
            // 摆风
            "toggleSwing" -> BedroomAC.toggleSwing()
            // 制冷模式
            "setCoolingMode" -> BedroomAC.setCoolingMode()
            // 制热模式
            "setHeatingMode" -> BedroomAC.setHeatingMode()
            // 除湿模式
            "setDryMode" -> BedroomAC.setDryMode()
            // 送风模式
            "setFanMode" -> BedroomAC.setFanMode()
            // 风速
            "toggleWindSpeed" -> BedroomAC.toggleWindSpeed()
            // 舒风模式
            "enableGentleMode" -> BedroomAC.enableGentleMode()
            // 屏显
            "toggleLight" -> BedroomAC.toggleLight()
            // 定时开机
            "setOnTimer" -> {
                val minutes = params.getInt("minutes")
                BedroomAC.setOnTimer(minutes)
            }
            // 定时关机
            "setOffTimer" -> {
                val minutes = params.getInt("minutes")
                BedroomAC.setOffTimer(minutes)
            }
            // 取消定时开机
            "cancelOnTimer" -> BedroomAC.cancelOnTimer()
            // 取消定时关机
            "cancelOffTimer" -> BedroomAC.cancelOffTimer()
            // 获取当前状态
            "getState" -> {
                helper.invokeCallback(groupId, "onState", BedroomAC.acState.toJson())
            }
            // 订阅状态变更
            "subscribeState" -> {
                if (stateCallback == null) {
                    stateCallback = ACStateCallback { state ->
                        helper.pushEvent("onACStateChanged", state.toJson())
                    }
                    BedroomAC.registerACStateListener(stateCallback!!)
                }
            }
            // 取消订阅
            "unsubscribeState" -> {
                stateCallback?.let { BedroomAC.unregisterACStateListener(it) }
                stateCallback = null
            }
        }
    }
}
