package com.yuwjoo.myhome.module.mqtt.topic

/**
 * 空调遥控指令
 */
enum class ACAction(val value: String) {
    TOGGLE_POWER("togglePower"),
    INCREASE_TEMPERATURE("increaseTemperature"),
    DECREASE_TEMPERATURE("decreaseTemperature"),
    TOGGLE_SWING("toggleSwing"),
    SET_COOLING_MODE("setCoolingMode"),
    SET_HEATING_MODE("setHeatingMode"),
    SET_DRY_MODE("setDryMode"),
    SET_FAN_MODE("setFanMode"),
    TOGGLE_WIND_SPEED("toggleWindSpeed"),
    ENABLE_GENTLE_MODE("enableGentleMode"),
    TOGGLE_LIGHT("toggleLight"),
    SET_ON_TIMER("setOnTimer"),
    SET_OFF_TIMER("setOffTimer"),
    CANCEL_ON_TIMER("cancelOnTimer"),
    CANCEL_OFF_TIMER("cancelOffTimer"),
    ;

    companion object {
        fun fromValue(value: String): ACAction {
            return entries.firstOrNull { it.value == value } ?: TOGGLE_POWER
        }
    }
}
