package com.yuwjoo.myhome.module.udp.model

import com.yuwjoo.myhome.module.udp.UdpConfig
import org.json.JSONArray
import org.json.JSONObject

/**
 * 本机设备信息
 */
data class LocalDevice(
    val deviceName: String = UdpConfig.deviceName, // 设备名称
    val online: Boolean = true, // 在线状态
    val abilities: List<String> = UdpConfig.deviceAbilities, // 能力列表（如 "topic:xxx"、"skill:xxx"）
    val latestSeq: Int = 0, // 最新消息序号
) {
    companion object {
        /**
         * 从 JSON 对象构造本机设备信息
         *
         * @param json JSON 对象
         * @return 本机设备信息
         */
        fun from(json: JSONObject): LocalDevice? {
            val name = json.optString("deviceName", "")
            if (name.isEmpty()) return null
            val abilitiesArr = json.optJSONArray("abilities")
            val abilities = if (abilitiesArr != null) {
                (0 until abilitiesArr.length()).map { abilitiesArr.getString(it) }
            } else {
                emptyList()
            }
            return LocalDevice(
                deviceName = name,
                online = json.optBoolean("online", true),
                abilities = abilities,
                latestSeq = json.optInt("latestSeq", 0),
            )
        }

        /**
         * 将本机设备信息导出为 JSON 对象
         *
         * @param device 本机设备信息
         * @return JSONObject
         */
        fun toObject(device: LocalDevice): JSONObject {
            val json = JSONObject()
            json.put("deviceName", device.deviceName)
            json.put("online", device.online)
            json.put("abilities", JSONArray(device.abilities))
            json.put("latestSeq", device.latestSeq)
            return json
        }
    }
}
