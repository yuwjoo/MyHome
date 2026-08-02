package com.yuwjoo.myhome.module.udp.client.model

import org.json.JSONArray
import org.json.JSONObject

/**
 * 局域网设备模型
 */
data class LanDevice(
    val ip: String, // 设备 IP 地址
    val deviceName: String = "", // 设备名称
    val abilities: List<String> = emptyList(), // 设备能力列表（如 "topic:xxx"、"skill:xxx"）
    var online: Boolean = false, // 是否在线
    var offlineAt: Long = 0L, // 离线时间戳（ms），用于超时检测
    val heartbeatInterval: Long = 0L, // 心跳发送间隔（ms）
    val heartbeatTimeout: Long = 0L, // 心跳过期间隔（ms）
) {
    companion object {
        /**
         * 将设备信息导出为 JSON
         *
         * @param device 设备信息
         * @return JSONObject
         */
        fun toObject(device: LanDevice): JSONObject {
            val json = JSONObject()
            json.put("ip", device.ip)
            json.put("deviceName", device.deviceName)
            json.put("abilities", JSONArray(device.abilities))
            json.put("online", device.online)
            json.put("offlineAt", device.offlineAt)
            json.put("heartbeatInterval", device.heartbeatInterval)
            json.put("heartbeatTimeout", device.heartbeatTimeout)
            return json
        }
    }
}
