package com.yuwjoo.myhome.activity.main.ui.webview

object BridgeConstant {
    const val API_BEDROOM_AC_TOGGLE_POWER = "bedroomAC/togglePower" // 开关机
    const val API_BEDROOM_AC_INCREASE_TEMPERATURE = "bedroomAC/increaseTemperature" // 增加温度
    const val API_BEDROOM_AC_DECREASE_TEMPERATURE = "bedroomAC/decreaseTemperature" // 降低温度
    const val API_BEDROOM_AC_TOGGLE_SWING = "bedroomAC/toggleSwing" // 切换摆风状态
    const val API_BEDROOM_AC_SET_COOLING_MODE = "bedroomAC/setCoolingMode" // 设置制冷模式
    const val API_BEDROOM_AC_SET_HEATING_MODE = "bedroomAC/setHeatingMode" // 设置制热模式
    const val API_BEDROOM_AC_TOGGLE_WIND_SPEED = "bedroomAC/toggleWindSpeed" // 切换风速
    const val API_BEDROOM_AC_ENABLE_GENTLE_MODE = "bedroomAC/enableGentleMode" // 启用舒风模式
    const val API_BEDROOM_AC_TOGGLE_SLEEP_MODE = "bedroomAC/toggleSleepMode" // 切换睡眠模式
    const val API_BEDROOM_AC_SET_TIMING = "bedroomAC/setTiming" // 设置定时
    const val API_BEDROOM_AC_CANCEL_TIMING = "bedroomAC/cancelTiming" // 取消定时
    const val API_BEDROOM_AC_GET_AC_STATE = "bedroomAC/getACState" // 获取空调状态
    const val API_BEDROOM_AC_GET_MQTT_STATE = "bedroomAC/getMQTTState" // 获取MQTT状态
    const val API_BEDROOM_AC_GET_SOCKET_STATE = "bedroomAC/getSocketState" // 获取Socket状态

    const val EVENT_SYNC_BEDROOM_AC_STATE = "syncBedroomACState" // 同步卧室空调状态
    const val EVENT_MQTT_CONNECT_STATE = "mqttConnectState" // MQTT连接状态
    const val EVENT_SOCKET_CONNECT_STATE = "socketConnectState" // Socket连接状态
}