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
    val type: Byte, // 帧类型
    val seqNum: Int, // 消息序号
    val flags: FrameDataFlags, // 标志位
    val payload: ByteArray, // 负载字节
) {
    val isOrdered: Boolean get() = flags.isOrdered // 是否为有序消息

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is FrameData) return false
        return type == other.type && seqNum == other.seqNum && flags == other.flags && payload.contentEquals(other.payload)
    }

    override fun hashCode(): Int {
        var result = type.toInt()
        result = 31 * result + seqNum
        result = 31 * result + flags.hashCode()
        result = 31 * result + payload.contentHashCode()
        return result
    }
}

/**
 * 序列化为 JSON 对象
 *
 * @receiver 帧数据
 * @return 帧数据的 JSON 对象
 */
fun FrameData.toJson(): JSONObject {
    return JSONObject().apply {
        put("type", type.toInt())
        put("seqNum", seqNum)
        put("flags", flags.toByte().toInt())
        put("isOrdered", isOrdered)
        put("payload", Base64.encodeToString(payload, Base64.NO_WRAP))
    }
}

/**
 * 从 JSON 字符串解析帧数据，反序列化失败时返回 null
 *
 * @param json 待解析的 JSON 字符串
 * @return 解析后的帧数据，失败返回 null
 */
fun FrameData.Companion.fromJsonString(json: String): FrameData? {
    return try {
        val obj = JSONObject(json)
        FrameData(
            type = obj.getInt("type").toByte(),
            seqNum = obj.getInt("seqNum"),
            flags = FrameDataFlags.fromByte(obj.getInt("flags").toByte()),
            payload = Base64.decode(obj.getString("payload"), Base64.NO_WRAP),
        )
    } catch (_: Exception) {
        null
    }
}
