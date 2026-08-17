package com.yuwjoo.myhome.module.peerudp.device

import org.json.JSONArray
import org.json.JSONObject

/**
 * LanDevice 序列化/反序列化器
 */
object LanDeviceSerializer {

    /**
     * LanDevice 转 JSON 字符串
     */
    fun toJsonString(device: LanDeviceInfo): String = JSONObject().apply {
        put("ip", device.ip)
        put("deviceName", device.deviceName)
        put("abilities", JSONArray(device.abilities))
        put("online", device.online)
        put("offlineAt", device.offlineAt)
        put("heartbeatInterval", device.heartbeatInterval)
        put("heartbeatTimeout", device.heartbeatTimeout)
    }.toString()

    /**
     * JSON 字符串转 LanDevice，失败返回 null
     */
    fun fromJsonString(json: String): LanDevice? {
        return try {
            val obj = JSONObject(json)
            val abilitiesJson = obj.optJSONArray("abilities")
            val abilities = if (abilitiesJson != null) {
                (0 until abilitiesJson.length()).map { abilitiesJson.getString(it) }
            } else {
                emptyList()
            }
            LanDevice(
                ip = obj.getString("ip"),
                deviceName = obj.optString("deviceName", ""),
                abilities = abilities,
                heartbeatInterval = obj.optLong("heartbeatInterval", 0L),
                heartbeatTimeout = obj.optLong("heartbeatTimeout", 0L),
            )
        } catch (_: Exception) {
            null
        }
    }
}
