package com.yuwjoo.myhome.module.device.bedroomAC

data class ACState(
    val power: Boolean = false,       // 电源
    val temperature: Int = 26,        // 设定温度 16~30
    val mode: String = "cool",        // "cool" | "heat" | "dry" | "fan"
    val swing: Boolean = false,       // 摆风
    val windSpeed: String = "auto",   // "auto" | "low" | "medium" | "high"
    val gentle: Boolean = false,      // 舒风
    val light: Boolean = true,        // 屏显
    val onTimer: Int = 0,             // 定时开机（分钟），0=关闭
    val offTimer: Int = 0,            // 定时关机（分钟），0=关闭
)
