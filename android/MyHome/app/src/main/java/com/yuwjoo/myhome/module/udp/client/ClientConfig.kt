package com.yuwjoo.myhome.module.udp.client

/**
 * UDP 客户端协议常量、帧格式、心跳/Ack 配置
 */
internal object ClientConfig {
    // 网络
    const val MULTICAST_ADDR = "239.0.0.100" // 组播地址
    const val BROADCAST_ADDR = "255.255.255.255" // 广播地址
    const val PORT = 8899 // 通信端口
    const val BUFFER_SIZE = 1024 // 接收缓冲区大小

    // 帧协议
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

    // 本机心跳
    const val HEARTBEAT_INTERVAL_MS = 1_500L // 本机心跳发送间隔（毫秒）
    const val HEARTBEAT_TIMEOUT_MS = 4_500L // 本机心跳过期间隔（毫秒）

    // 本机设备
    val DEVICE_NAME: String = "${android.os.Build.MANUFACTURER}-${android.os.Build.MODEL}" // 本机设备名称
    val DEVICE_ABILITIES: List<String> = emptyList() // 本机设备能力列表
    const val ABILITY_PREFIX_TOPIC = "topic:" // 订阅的主题
    const val ABILITY_PREFIX_SKILL = "skill:" // 设备技能

    /**
     * 从 IP 提取主机号（IP 最后一字节）
     */
    fun hostId(ip: String): Int = ip.substringAfterLast('.').toIntOrNull() ?: 0
}
