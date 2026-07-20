package com.yuwjoo.myhome.module.udp.client

import android.os.Build

/**
 * UDP 客户端配置常量
 */
internal object UdpConfig {

    const val MULTICAST_ADDR = "239.0.0.100" // 组播地址
    const val BROADCAST_ADDR = "255.255.255.255" // 广播地址
    const val PORT = 8899 // 通信端口
    const val BUFFER_SIZE = 1024 // 接收缓冲区大小

    const val MAGIC = 0x5948 // 魔数
    const val VERSION: Byte = 0x01 // 协议版本
    const val HEADER_SIZE = 9 // 帧头字节数（MAGIC + version + type + seqNum + flags + payLen，不含 CRC）
    const val CRC_SIZE = 2 // CRC16 校验字节数
    const val ACK_PAYLOAD_SIZE = 4 // ACK 负载字节数（AckSeq uint16 + CurrentSeq uint16）

    const val HEARTBEAT_INTERVAL_MS = 1_500L // 心跳间隔（毫秒）
    const val HEARTBEAT_OFFLINE_TIMEOUT_MS = 4_500L // 设备离线超时（毫秒）

    val DEVICE_NAME: String = "${Build.MANUFACTURER}-${Build.MODEL}" // 本机设备名称
    val DEVICE_ABILITIES: List<String> = emptyList() // 本机设备能力列表

    object Type {
        const val HEARTBEAT: Byte = 0x01 // 设备在线宣告，周期性广播
        const val OFFLINE: Byte   = 0x02 // 设备主动离网通知
        const val CALL: Byte      = 0x03 // 向新发现设备发起呼叫，请求其设备信息
        const val ANSWER: Byte    = 0x04 // 回应 Call，返回自身设备信息
        const val ACK: Byte       = 0x05 // 消息确认应答
        const val JSON: Byte      = 0x10 // JSON 消息
        const val RAW: Byte       = 0x11 // 原始消息，负载为自定义二进制
    }

    object Flags {
        const val NONE: Byte    = 0x00 // 无标志
        const val NEED_ACK: Byte = 0x01 // 需要 ACK 确认
        const val ORDERED: Byte  = 0x02 // 有序消息（需去重）
    }

    const val ABILITY_PREFIX_TOPIC = "topic:" // 主题订阅能力前缀
    const val ABILITY_PREFIX_SKILL = "skill:" // 设备技能能力前缀

    const val MAX_PAYLOAD_SIZE = 1024 // 最大 payload 长度（MTU 1500 - IP/UDP 头 28 - 协议头 13）
}
