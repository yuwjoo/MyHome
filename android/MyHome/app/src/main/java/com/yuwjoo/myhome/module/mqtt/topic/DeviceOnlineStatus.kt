package com.yuwjoo.myhome.module.mqtt.topic

/**
 * 设备在线状态
 */
enum class DeviceOnlineStatus(val value: String) {
    ONLINE("online"),
    OFFLINE("offline"),
    ;

    companion object {
        fun fromValue(value: String): DeviceOnlineStatus {
            return entries.firstOrNull { it.value == value } ?: OFFLINE
        }
    }
}
