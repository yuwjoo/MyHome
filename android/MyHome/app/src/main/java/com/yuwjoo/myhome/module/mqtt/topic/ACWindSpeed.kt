package com.yuwjoo.myhome.module.mqtt.topic

/**
 * 空调风速
 */
enum class ACWindSpeed(val value: String) {
    AUTO("auto"),
    LOW("low"),
    MEDIUM("medium"),
    HIGH("high"),
    ;

    companion object {
        fun fromValue(value: String): ACWindSpeed {
            return entries.firstOrNull { it.value == value } ?: AUTO
        }
    }
}
