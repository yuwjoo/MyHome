package com.yuwjoo.myhome.common.device.esp8266

import com.yuwjoo.myhome.common.topic.payload.DataESP8266Payload

/**
 * 设备在线状态变化回调
 */
fun interface ESP8266Callback {
    /**
     * @param state 最新设备状态
     */
    fun onStatusChanged(state: DataESP8266Payload)
}
