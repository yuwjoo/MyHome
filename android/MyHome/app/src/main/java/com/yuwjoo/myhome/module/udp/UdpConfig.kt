package com.yuwjoo.myhome.module.udp

/**
 * UDP 通信配置常量
 */
internal object UdpConfig {
    const val MULTICAST_ADDR = "239.0.0.100" // 组播地址
    const val PORT = 8899 // 组播端口

    const val HEARTBEAT_INTERVAL = 1_500L // 心跳间隔（毫秒）
    const val HEARTBEAT_OFFLINE_TIMEOUT = 4_500L // 设备离线超时（毫秒）

    const val TOPIC_CALL = "YHome/cmd/call" // 呼叫主题
    const val TOPIC_RESPONSE = "YHome/cmd/response" // 应答主题

    const val ABILITY_PREFIX_TOPIC = "topic:" // 能力前缀：订阅的主题
    const val ABILITY_PREFIX_SKILL = "skill:" // 能力前缀：设备技能

    val deviceName: String = "${android.os.Build.MANUFACTURER}-${android.os.Build.MODEL}" // 本机设备名称
    val deviceAbilities: List<String> = emptyList() // 本机设备能力列表
}
