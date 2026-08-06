package com.yuwjoo.myhome.module.udpcomm.frame

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
