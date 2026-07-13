package com.yuwjoo.myhome.module.udp.model

import org.json.JSONArray
import org.json.JSONObject

/**
 * 内网设备信息
 */
data class LanDevice(
    val ipAddress: String, // IP 地址
    val deviceName: String, // 设备名称
    val online: Boolean, // 在线状态
    val abilities: List<String>, // 能力列表（如 "topic:xxx"、"skill:xxx"）
    val lastHeartbeatTime: Long = System.currentTimeMillis(), // 最后一次心跳时间
) {
    companion object {
        /**
         * 从 IP 和 JSON 对象构造设备信息
         *
         * @param ip   设备 IP 地址
         * @param json JSON 对象
         * @return 设备信息
         */
        fun from(ip: String, json: JSONObject): LanDevice? {
            val name = json.optString("deviceName", "")
            val abilitiesArr = json.optJSONArray("abilities")
            val abilities = if (abilitiesArr != null) {
                (0 until abilitiesArr.length()).map { abilitiesArr.getString(it) }
            } else {
                emptyList()
            }
            return LanDevice(
                ipAddress = ip,
                deviceName = name,
                online = json.optBoolean("online", true),
                abilities = abilities,
            )
        }

        /**
         * 将设备信息导出为 JSON 对象
         *
         * @param device 设备信息
         * @return JSONObject
         */
        fun toObject(device: LanDevice): JSONObject {
            val json = JSONObject()
            json.put("ipAddress", device.ipAddress)
            json.put("deviceName", device.deviceName)
            json.put("online", device.online)
            json.put("abilities", JSONArray(device.abilities))
            return json
        }
    }
}
