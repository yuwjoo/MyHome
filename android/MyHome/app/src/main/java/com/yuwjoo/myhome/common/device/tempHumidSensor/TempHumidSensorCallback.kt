package com.yuwjoo.myhome.common.device.tempHumidSensor

import com.yuwjoo.myhome.common.topic.payload.DataTempHumidSensorPayload

/**
 * 温湿度传感器数据变化回调
 */
fun interface TempHumidSensorCallback {
    /**
     * @param state 最新传感器数据
     */
    fun onStateChanged(state: DataTempHumidSensorPayload)
}
