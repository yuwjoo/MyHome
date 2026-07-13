package com.yuwjoo.myhome.module.udp

/**
 * UDP 通信配置常量。
 */
internal object UdpConfig {
    const val PORT = 8899 // 组播端口（监听与发送共用）
    const val MULTICAST_ADDR = "224.0.0.100" // 组播地址

    const val SCAN_COUNT = 3 // 设备扫描次数
    const val SCAN_INTERVAL = 1000L // 扫描间隔（毫秒）
    const val TOPIC_SCAN_DEVICES = "YHome/cmd/scanDevices" // 扫描设备主题
    const val TOPIC_LOCAL_DEVICE = "YHome/data/localDevice" // 本地设备信息主题

    const val HEARTBEAT_TOPIC = "YHome/cmd/udpHeartbeat" // 心跳主题
    const val HEARTBEAT_INTERVAL = 10_000L // 心跳间隔（毫秒）
    const val HEARTBEAT_OFFLINE_TIMEOUT = 30_000L // 设备离线超时（毫秒）

    const val ABILITY_PREFIX_TOPIC = "topic:" // 能力前缀：订阅的主题
    const val ABILITY_PREFIX_SKILL = "skill:" // 能力前缀：设备技能

    val deviceName: String = "${android.os.Build.MANUFACTURER}-${android.os.Build.MODEL}" // 本机设备名称
    val deviceAbilities: List<String> = emptyList() // 本机设备能力列表
}
