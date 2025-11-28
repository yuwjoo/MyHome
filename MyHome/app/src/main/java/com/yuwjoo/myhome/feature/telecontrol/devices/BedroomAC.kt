package com.yuwjoo.myhome.feature.telecontrol.devices

import com.yuwjoo.myhome.MainActivity
import com.yuwjoo.myhome.common.bridge.BridgeConstant
import com.yuwjoo.myhome.feature.telecontrol.Telecontrol
import com.yuwjoo.myhome.feature.telecontrol.utils.MQTTTConstant

/**
 * 卧室空调类
 */
object BedroomAC {
    var aCStateJSONText: String? = null // 空调状态JSON字符串
        private set

    /**
     * 开机/关机
     */
    fun togglePower() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "togglePower"
        )
    }

    /**
     * 增加温度
     */
    fun increaseTemperature() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "increaseTemperature"
        )
    }

    /**
     * 降低温度
     */
    fun decreaseTemperature() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "decreaseTemperature"
        )
    }

    /**
     * 切换摆风状态
     */
    fun toggleSwing() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "toggleSwing"
        )
    }

    /**
     * 设置制冷模式
     */
    fun setCoolingMode() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "setCoolingMode"
        )
    }

    /**
     * 设置制热模式
     */
    fun setHeatingMode() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "setHeatingMode"
        )
    }

    /**
     * 切换风速
     */
    fun toggleWindSpeed() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "toggleWindSpeed"
        )
    }

    /**
     * 启用舒风模式
     */
    fun enableGentleMode() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "enableGentleMode"
        )
    }

    /**
     * 切换睡眠模式
     */
    fun toggleSleepMode() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "toggleSleepMode"
        )
    }

    /**
     * 设置定时
     * @param optionsJsonText 配置项json字符串
     */
    fun setTiming(optionsJsonText: String) {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "setTiming",
            optionsJsonText
        )
    }

    /**
     * 取消定时
     */
    fun cancelTiming() {
        Telecontrol.sendMessage(
            MQTTTConstant.TOPIC_RC_BEDROOM_AC,
            "cancelTiming"
        )
    }

    /**
     * 同步空调状态
     * @param stateJsonText 状态json字符串
     */
    fun syncACState(stateJsonText: String?) {
        aCStateJSONText = stateJsonText
        MainActivity.instance?.apply {
            homeWebView.channel.send(
                BridgeConstant.EVENT_SYNC_BEDROOM_AC_STATE,
                stateJsonText
            )
        }
    }
}