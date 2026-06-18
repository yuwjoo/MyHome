package com.yuwjoo.myhome.modules.devices.tempHumid

interface TempHumidCallback {
    /**
     * 温湿度数据更新
     * @param state 最新温湿度数据
     */
    fun onStateChanged(state: TempHumidState)
}
