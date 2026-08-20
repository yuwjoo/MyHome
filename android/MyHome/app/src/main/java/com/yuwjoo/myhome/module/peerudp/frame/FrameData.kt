package com.yuwjoo.myhome.module.peerudp.frame

import android.util.Base64
import org.json.JSONObject

/**
 * 帧数据
 *
 * @property type    帧类型
 * @property seqNum  消息序号
 * @property flags   标志位
 * @property payload 负载字节
 */
data class FrameData(
    val type: Byte,
    val seqNum: Int,
    val flags: Byte,
    val payload: ByteArray,
) {
    val isOrdered: Boolean get() = (flags.toInt() and 0x01) != 0 // 是否为有序消息

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is FrameData) return false
        return type == other.type && seqNum == other.seqNum && flags == other.flags && payload.contentEquals(other.payload)
    }

    override fun hashCode(): Int {
        var result = type.toInt()
        result = 31 * result + seqNum
        result = 31 * result + flags.toInt()
        result = 31 * result + payload.contentHashCode()
        return result
    }
}

/**
 * FrameData 转 JSON 字符串，用于序列化
 *
 * @param data 待序列化的帧数据
 * @return UTF-8 JSON 字符串
 */
fun frameDataToJsonString(data: FrameData): String {
    return JSONObject().apply {
        put("type", data.type.toInt())
        put("seqNum", data.seqNum)
        put("flags", data.flags.toInt())
        put("isOrdered", data.isOrdered)
        put("payload", Base64.encodeToString(data.payload, Base64.NO_WRAP))
    }.toString()
}

/**
 * JSON 字符串转 FrameData，反序列化失败时返回 null
 *
 * @param json 待解析的 JSON 字符串
 * @return 解析后的 FrameData，失败返回 null
 */
fun jsonStringToFrameData(json: String): FrameData? {
    return try {
        val obj = JSONObject(json)
        FrameData(
            type = obj.getInt("type").toByte(),
            seqNum = obj.getInt("seqNum"),
            flags = obj.getInt("flags").toByte(),
            payload = Base64.decode(obj.getString("payload"), Base64.NO_WRAP),
        )
    } catch (_: Exception) {
        null
    }
}
