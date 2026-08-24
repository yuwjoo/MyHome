package com.yuwjoo.myhome.module.peerudp.frame

import com.yuwjoo.myhome.module.udp.client.config.FrameConfig

/**
 * 帧数据标志位
 *
 * @property isOrdered 是否为有序消息（有序消息隐含需 Ack 确认）
 */
data class FrameDataFlags(
    val isOrdered: Boolean = false, // 是否为有序消息（有序消息隐含需 Ack 确认）
)

/**
 * 从帧头 Flags 字节解析帧数据标志位
 *
 * @param value 帧头 Flags 字节
 * @return 解析后的帧数据标志位
 */
fun FrameDataFlags.Companion.fromByte(value: Byte): FrameDataFlags {
    return FrameDataFlags(isOrdered = (value.toInt() and 0x01) != 0)
}

/**
 * 转帧头 Flags 字节
 *
 * @receiver 帧数据标志位
 * @return 帧头 Flags 字节
 */
fun FrameDataFlags.toByte(): Byte {
    return if (isOrdered) FrameConfig.Flags.ORDERED else FrameConfig.Flags.NONE
}