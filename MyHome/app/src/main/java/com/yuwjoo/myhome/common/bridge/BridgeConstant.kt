package com.yuwjoo.myhome.common.bridge

object BridgeConstant {

    /**
     * 遥控-api
     */
    const val API_TELECONTROL_GET_MQTT_STATE = "telecontrol/getMQTTState" // 获取MQTT状态
    const val API_TELECONTROL_GET_SOCKET_STATE = "telecontrol/getSocketState" // 获取Socket状态

    /**
     * 遥控-event
     */
    const val EVENT_SYNC_MQTT_STATE = "syncMqttState" // 同步MQTT状态
    const val EVENT_SYNC_SOCKET_STATE = "syncSocketConnectState" // 同步Socket状态

    /**
     * 遥控-卧室空调-api
     */
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

    /**
     * 遥控-卧室空调-event
     */
    const val EVENT_SYNC_BEDROOM_AC_STATE = "syncBedroomACState" // 同步卧室空调状态

    /**
     * 相册-api
     */
    const val API_ALBUM_PICK_FILE = "album/pickFile" // 选择文件
    const val API_ALBUM_SAVE_ALBUM = "album/saveAlbum" // 保存相册
}