package com.yuwjoo.myhome.modules.controller.tempHumid

data class TempHumidState(
    val temperature: Float = 0f, // 温度 °C
    val humidity: Float = 0f, // 湿度 %
)
