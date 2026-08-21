package com.yuwjoo.myhome.module.peerudp.device

import org.json.JSONArray
import org.json.JSONObject

/**
 * 设备信息（Call / Answer 帧携带的 JSON 负载）
 *
 * @property deviceName       设备名称
 * @property abilities        设备能力列表
 * @property heartbeatInterval 心跳发送间隔（毫秒）
 * @property heartbeatTimeout  心跳过期间隔（毫秒）
 */
data class DeviceInfoMessage(
    val deviceName: String, // 设备名称
    val abilities: List<String>, // 设备能力列表
    val heartbeatInterval: Long, // 心跳发送间隔（ms）
    val heartbeatTimeout: Long, // 心跳过期间隔（ms）
)

/**
 * 将设备信息序列化为 JSON 字节数组（UTF-8）
 *
 * @param info 设备信息
 * @return UTF-8 编码的 JSON 字节数组
 */
fun deviceInfoToBytes(info: DeviceInfoMessage): ByteArray {
    val json = JSONObject().apply {
        put("deviceName", info.deviceName)
        put("abilities", JSONArray(info.abilities))
        put("heartbeatInterval", info.heartbeatInterval)
        put("heartbeatTimeout", info.heartbeatTimeout)
    }
    return json.toString().toByteArray(Charsets.UTF_8)
}

/**
 * 从 JSON 对象解析设备信息
 *
 * @param json JSON 对象
 * @return 解析后的设备信息，解析失败返回 null
 */
fun jsonToDeviceInfo(json: JSONObject): DeviceInfoMessage? {
    return try {
        val abilities = mutableListOf<String>()
        val arr = json.optJSONArray("abilities")
        if (arr != null) {
            for (i in 0 until arr.length()) {
                arr.optString(i)?.let { if (it.isNotEmpty()) abilities.add(it) }
            }
        }
        DeviceInfoMessage(
            deviceName = json.optString("deviceName", ""),
            abilities = abilities,
            heartbeatInterval = json.optLong("heartbeatInterval", 0L),
            heartbeatTimeout = json.optLong("heartbeatTimeout", 0L),
        )
    } catch (_: Exception) {
        null
    }
}

/**
 * 从 JSON 字节数组解析设备信息
 *
 * @receiver 设备信息 JSON 字节数组
 * @return 解析后的设备信息，解析失败返回 null
 */
fun ByteArray.parseDeviceInfo(): DeviceInfoMessage? {
    return try {
        jsonToDeviceInfo(JSONObject(String(this, Charsets.UTF_8)))
    } catch (_: Exception) {
        null
    }
}
