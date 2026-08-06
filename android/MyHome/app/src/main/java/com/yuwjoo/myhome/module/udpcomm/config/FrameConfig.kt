package com.yuwjoo.myhome.module.udp.client.config

/**
 * 帧协议配置
 */
internal object FrameConfig {
    const val MAGIC = 0x5948 // 魔数 uint16
    const val HEADER_SIZE = 10 // 帧头字节数
    const val ACK_PAYLOAD_SIZE = 4 // Ack 负载字节数

    object Type {
        const val HEARTBEAT = 0x01.toByte() // 设备在线宣告
        const val OFFLINE = 0x02.toByte() // 设备主动离网
        const val CALL = 0x03.toByte() // 向新发现设备发起呼叫
        const val ANSWER = 0x04.toByte() // 回应 Call
        const val ACK = 0x05.toByte() // 消息确认应答
        const val JSON = 0x10.toByte() // JSON 消息
        const val RAW = 0x11.toByte() // 原始二进制消息
    }

    object Flags {
        const val NONE = 0x00.toByte() // 无标志（无序消息）
        const val ORDERED = 0x01.toByte() // 有序消息（隐含需 Ack）
    }
}
