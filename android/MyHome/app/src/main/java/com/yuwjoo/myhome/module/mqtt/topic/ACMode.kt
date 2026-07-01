package com.yuwjoo.myhome.module.mqtt.topic

/**
 * 空调运行模式
 */
enum class ACMode(val value: String) {
    COOL("cool"),
    HEAT("heat"),
    DRY("dry"),
    FAN("fan"),
    ;

    companion object {
        fun fromValue(value: String): ACMode {
            return entries.firstOrNull { it.value == value } ?: COOL
        }
    }
}
