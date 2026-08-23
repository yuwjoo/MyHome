package com.yuwjoo.myhome.module.peerudp.frame

import org.json.JSONArray
import org.json.JSONObject

/**
 * 设备信息负载（Call / Answer 帧携带的 JSON 负载）
 *
 * @property deviceName        设备名称
 * @property abilities         设备能力列表，如 `"topic:xxx"`、`"skill:xxx"`
 * @property heartbeatInterval 心跳发送间隔（毫秒），0 表示不发送心跳
 * @property heartbeatTimeout  心跳过期间隔（毫秒），超时未收到心跳判定离线
 */
data class DeviceInfoPayload(
    val deviceName: String = "", // 设备名称
    val abilities: List<String> = emptyList(), // 设备能力列表
    val heartbeatInterval: Long = 0L, // 心跳发送间隔（ms）
    val heartbeatTimeout: Long = 0L, // 心跳过期间隔（ms）
)

/**
 * 从 JSON 字符串解析设备信息负载，反序列化失败时返回 null
 *
 * @param json 待解析的 JSON 字符串
 * @return 解析后的设备信息负载，失败返回 null
 */
fun DeviceInfoPayload.Companion.fromJsonString(json: String): DeviceInfoPayload? {
    return try {
        val obj = JSONObject(json)
        val abilities = mutableListOf<String>()
        obj.optJSONArray("abilities")?.let { arr ->
            for (i in 0 until arr.length()) {
                arr.optString(i).takeIf { it.isNotEmpty() }?.let { abilities.add(it) }
            }
        }
        DeviceInfoPayload(
            deviceName = obj.optString("deviceName", ""),
            abilities = abilities,
            heartbeatInterval = obj.optLong("heartbeatInterval", 0L),
            heartbeatTimeout = obj.optLong("heartbeatTimeout", 0L),
        )
    } catch (_: Exception) {
        null
    }
}

/**
 * 从 JSON 字节数组解析设备信息负载，反序列化失败时返回 null
 *
 * @param bytes 设备信息 JSON 字节数组
 * @return 解析后的设备信息负载，失败返回 null
 */
fun DeviceInfoPayload.Companion.fromBytes(bytes: ByteArray): DeviceInfoPayload? {
    return fromJsonString(String(bytes, Charsets.UTF_8))
}

/**
 * 序列化为 JSON 对象
 *
 * @receiver 设备信息负载
 * @return 设备信息的 JSON 对象
 */
fun DeviceInfoPayload.toJson(): JSONObject {
    return JSONObject().apply {
        put("deviceName", deviceName)
        put("abilities", JSONArray(abilities))
        put("heartbeatInterval", heartbeatInterval)
        put("heartbeatTimeout", heartbeatTimeout)
    }
}

/**
 * 序列化为 JSON 字节数组（UTF-8）
 *
 * @receiver 设备信息负载
 * @return UTF-8 编码的 JSON 字节数组
 */
fun DeviceInfoPayload.toBytes(): ByteArray {
    return toJson().toString().toByteArray(Charsets.UTF_8)
}
