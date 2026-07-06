package com.yuwjoo.myhome.common.bridge

import com.yuwjoo.myhome.common.device.bedroomAC.ACStateCallback
import com.yuwjoo.myhome.common.device.bedroomAC.BedroomACDevice
import com.yuwjoo.myhome.module.bridge.annotation.BridgeGroup
import com.yuwjoo.myhome.module.bridge.annotation.BridgeMessage
import com.yuwjoo.myhome.module.bridge.core.MessageSender
import org.json.JSONObject

/**
 * 卧室空调分组
 */
@BridgeGroup("bedroomAC")
class BedroomACGroup {

    private var stateCallback: ACStateCallback? = null

    /**
     * 开关电源
     */
    @BridgeMessage("togglePower")
    fun togglePower(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.togglePower()
    }

    /**
     * 温度 +1
     */
    @BridgeMessage("increaseTemperature")
    fun increaseTemperature(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.increaseTemperature()
    }

    /**
     * 温度 -1
     */
    @BridgeMessage("decreaseTemperature")
    fun decreaseTemperature(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.decreaseTemperature()
    }

    /**
     * 切换摆风
     */
    @BridgeMessage("toggleSwing")
    fun toggleSwing(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.toggleSwing()
    }

    /**
     * 制冷模式
     */
    @BridgeMessage("setCoolingMode")
    fun setCoolingMode(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.setCoolingMode()
    }

    /**
     * 制热模式
     */
    @BridgeMessage("setHeatingMode")
    fun setHeatingMode(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.setHeatingMode()
    }

    /**
     * 除湿模式
     */
    @BridgeMessage("setDryMode")
    fun setDryMode(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.setDryMode()
    }

    /**
     * 送风模式
     */
    @BridgeMessage("setFanMode")
    fun setFanMode(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.setFanMode()
    }

    /**
     * 切换风速
     */
    @BridgeMessage("toggleWindSpeed")
    fun toggleWindSpeed(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.toggleWindSpeed()
    }

    /**
     * 舒风模式
     */
    @BridgeMessage("enableGentleMode")
    fun enableGentleMode(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.enableGentleMode()
    }

    /**
     * 切换屏显
     */
    @BridgeMessage("toggleLight")
    fun toggleLight(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.toggleLight()
    }

    /**
     * 定时开机
     *
     * @param params 包含定时分钟数的 JSON 对象
     */
    @BridgeMessage("setOnTimer")
    fun setOnTimer(params: JSONObject, sender: MessageSender) {
        val minutes = params.getInt("minutes")
        BedroomACDevice.setOnTimer(minutes)
    }

    /**
     * 定时关机
     *
     * @param params 包含定时分钟数的 JSON 对象
     */
    @BridgeMessage("setOffTimer")
    fun setOffTimer(params: JSONObject, sender: MessageSender) {
        val minutes = params.getInt("minutes")
        BedroomACDevice.setOffTimer(minutes)
    }

    /**
     * 取消定时开机
     */
    @BridgeMessage("cancelOnTimer")
    fun cancelOnTimer(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.cancelOnTimer()
    }

    /**
     * 取消定时关机
     */
    @BridgeMessage("cancelOffTimer")
    fun cancelOffTimer(params: JSONObject, sender: MessageSender) {
        BedroomACDevice.cancelOffTimer()
    }

    /**
     * 空调状态事件处理，根据 action 订阅或取消状态监听
     *
     * @param params 包含 action 字段 ("on" / "off") 的 JSON 对象
     */
    @BridgeMessage("acState")
    fun acState(params: JSONObject, sender: MessageSender) {
        val action = params.getString("action")

        when (action) {
            "on" -> {
                sender.sendEventMessage(JSONObject(BedroomACDevice.acState.toJson()), isRetained = true)
                if (stateCallback == null) {
                    stateCallback = ACStateCallback { state ->
                        sender.sendEventMessage(JSONObject(state.toJson()), isRetained = true)
                    }
                    BedroomACDevice.registerACStateListener(stateCallback!!)
                }
            }
            "off" -> {
                stateCallback?.let { BedroomACDevice.unregisterACStateListener(it) }
                stateCallback = null
            }
        }
    }
}
