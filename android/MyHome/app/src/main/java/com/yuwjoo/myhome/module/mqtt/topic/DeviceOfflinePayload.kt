package com.yuwjoo.myhome.module.mqtt.topic

import org.json.JSONObject

/**
 * 设备在线状态负载
 *
 * @property status 在线状态
 */
data class DeviceOfflinePayload(
    var status: DeviceOnlineStatus = DeviceOnlineStatus.OFFLINE,
) {
    /**
     * 基于 JSON 字符串构造
     *
     * @param json MQTT 消息内容
     */
    constructor(json: String) : this() {
        fromJson(json)
    }

    /**
     * 解析 JSON
     *
     * @param json MQTT 消息内容
     */
    fun fromJson(json: String) {
        val obj = JSONObject(json)
        status = DeviceOnlineStatus.fromValue(obj.optString("status", "offline"))
    }

    /**
     * 构造 JSON
     */
    fun toJson(): String {
        return """{"status":"${status.value}"}"""
    }
}
