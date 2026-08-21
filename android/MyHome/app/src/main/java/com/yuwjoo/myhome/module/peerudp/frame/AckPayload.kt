package com.yuwjoo.myhome.module.peerudp.frame

import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import org.json.JSONObject

/**
 * Ack 负载数据
 *
 * @property ackSeq  被确认的消息序号
 * @property recvSeq 接收方当前允许接收的有序消息序号
 */
data class AckPayload(
    val ackSeq: Int,
    val recvSeq: Int,
)

/**
 * 将 Ack 负载编码为 4 字节定长二进制（uint16 大端序）
 *
 * @param data Ack 负载数据
 * @return 4 字节 Ack 负载
 */
fun encodeAckPayload(data: AckPayload): ByteArray {
    return byteArrayOf(
        ((data.ackSeq shr 8) and 0xFF).toByte(),
        (data.ackSeq and 0xFF).toByte(),
        ((data.recvSeq shr 8) and 0xFF).toByte(),
        (data.recvSeq and 0xFF).toByte(),
    )
}

/**
 * 从 Ack 负载解析确认序号与接收方允许接收的序号
 *
 * @param payload Ack 帧负载
 * @return 解析后的 AckPayload，负载长度不足时返回 null
 */
fun decodeAckPayload(payload: ByteArray): AckPayload? {
    if (payload.size < FrameConfig.ACK_PAYLOAD_SIZE) return null
    val ackSeq = ((payload[0].toInt() and 0xFF) shl 8) or (payload[1].toInt() and 0xFF)
    val recvSeq = ((payload[2].toInt() and 0xFF) shl 8) or (payload[3].toInt() and 0xFF)
    return AckPayload(
        ackSeq = ackSeq,
        recvSeq = recvSeq,
    )
}

/**
 * AckPayload 转 JSON 字符串，用于序列化
 *
 * @param data 待序列化的 Ack 负载数据
 * @return UTF-8 JSON 字符串
 */
fun ackPayloadToJsonString(data: AckPayload): String {
    return JSONObject().apply {
        put("ackSeq", data.ackSeq)
        put("recvSeq", data.recvSeq)
    }.toString()
}

/**
 * JSON 字符串转 AckPayload，反序列化失败时返回 null
 *
 * @param json 待解析的 JSON 字符串
 * @return 解析后的 AckPayload，失败返回 null
 */
fun jsonStringToAckPayload(json: String): AckPayload? {
    return try {
        val obj = JSONObject(json)
        AckPayload(
            ackSeq = obj.getInt("ackSeq"),
            recvSeq = obj.getInt("recvSeq"),
        )
    } catch (_: Exception) {
        null
    }
}
