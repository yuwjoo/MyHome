package com.yuwjoo.myhome.module.peerudp.frame

import android.util.Base64
import org.json.JSONObject

/**
 * FrameData 序列化/反序列化器
 */
object FrameDataSerializer {

    /**
     * FrameData 转 JSON 字符串
     */
    fun toJsonString(data: FrameData) = JSONObject().apply {
        put("type", data.type.toInt())
        put("seqNum", data.seqNum)
        put("flags", data.flags.toInt())
        put("isOrdered", data.isOrdered)
        put("payload", Base64.encodeToString(data.payload, Base64.NO_WRAP))
    }.toString()

    /**
     * JSON 字符串转 FrameData，失败返回 null
     */
    fun fromJsonString(json: String): FrameData? {
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
}
