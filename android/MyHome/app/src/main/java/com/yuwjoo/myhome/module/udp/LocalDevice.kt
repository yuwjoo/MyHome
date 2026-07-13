package com.yuwjoo.myhome.module.udp

import org.json.JSONArray
import org.json.JSONObject

/**
 * 本机设备信息。
 */
data class LocalDevice(
    val deviceName: String = UdpConfig.deviceName, // 设备名称
    var online: Boolean = true, // 在线状态
    val abilities: List<String> = UdpConfig.deviceAbilities, // 能力列表（如 "topic:xxx"、"skill:xxx"）
) {
    companion object {
        /**
         * 从消息负载构造本机设备信息
         *
         * @param payload 消息负载
         * @return 本机设备信息，解析失败返回 null
         */
        fun fromPayload(payload: JSONObject?): LocalDevice? {
            val json = payload ?: return null
            val abilitiesArr = json.optJSONArray("abilities")
            val abilities = if (abilitiesArr != null) {
                (0 until abilitiesArr.length()).map { abilitiesArr.getString(it) }
            } else {
                emptyList()
            }
            return LocalDevice(
                deviceName = json.optString("deviceName", ""),
                online = json.optBoolean("online", true),
                abilities = abilities,
            )
        }

        /**
         * 将本机设备信息导出为 JSON 消息
         *
         * @param device 本机设备信息
         * @return JSONObject
         */
        fun toPayload(device: LocalDevice): JSONObject {
            val json = JSONObject()
            json.put("deviceName", device.deviceName)
            json.put("online", device.online)
            json.put("abilities", JSONArray(device.abilities))
            return json
        }
    }
}
