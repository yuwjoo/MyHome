package com.yuwjoo.myhome.common.topic.enums

/**
 * 空调遥控指令
 */
enum class ACAction(val value: String) {
    TOGGLE_POWER("togglePower"), // 开关机
    INCREASE_TEMPERATURE("increaseTemperature"), // 升温
    DECREASE_TEMPERATURE("decreaseTemperature"), // 降温
    TOGGLE_SWING("toggleSwing"), // 摆风
    SET_COOLING_MODE("setCoolingMode"), // 制冷模式
    SET_HEATING_MODE("setHeatingMode"), // 制热模式
    SET_DRY_MODE("setDryMode"), // 除湿模式
    SET_FAN_MODE("setFanMode"), // 送风模式
    TOGGLE_WIND_SPEED("toggleWindSpeed"), // 切换风速
    ENABLE_GENTLE_MODE("enableGentleMode"), // 静音模式
    TOGGLE_LIGHT("toggleLight"), // 灯光
    SET_ON_TIMER("setOnTimer"), // 定时开机
    SET_OFF_TIMER("setOffTimer"), // 定时关机
    CANCEL_ON_TIMER("cancelOnTimer"), // 取消定时开机
    CANCEL_OFF_TIMER("cancelOffTimer"), // 取消定时关机
}
