package com.yuwjoo.myhome.module.peerudp.frame

import com.yuwjoo.myhome.module.udp.client.config.FrameConfig

/**
 * Ack 负载数据（4 字节定长二进制，uint16 大端序）
 *
 * @property ackSeq  被确认的消息序号
 * @property recvSeq 接收方当前允许接收的有序消息序号
 */
data class AckPayload(
    val ackSeq: Int, // 被确认的消息序号
    val recvSeq: Int, // 接收方当前允许接收的有序消息序号
)

/**
 * 从 Ack 帧负载解析，负载长度不足时返回 null
 *
 * @param payload Ack 帧负载
 * @return 解析后的 Ack 负载数据，负载长度不足时返回 null
 */
fun AckPayload.Companion.fromBytes(payload: ByteArray): AckPayload? {
    if (payload.size < FrameConfig.ACK_PAYLOAD_SIZE) return null
    val ackSeq = ((payload[0].toInt() and 0xFF) shl 8) or (payload[1].toInt() and 0xFF)
    val recvSeq = ((payload[2].toInt() and 0xFF) shl 8) or (payload[3].toInt() and 0xFF)
    return AckPayload(
        ackSeq = ackSeq,
        recvSeq = recvSeq,
    )
}

/**
 * 序列化为 4 字节 Ack 负载
 *
 * @receiver Ack 负载数据
 * @return 4 字节 Ack 负载
 */
fun AckPayload.toBytes(): ByteArray {
    return byteArrayOf(
        ((ackSeq shr 8) and 0xFF).toByte(),
        (ackSeq and 0xFF).toByte(),
        ((recvSeq shr 8) and 0xFF).toByte(),
        (recvSeq and 0xFF).toByte(),
    )
}