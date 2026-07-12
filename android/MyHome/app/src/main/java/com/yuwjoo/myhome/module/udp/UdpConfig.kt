package com.yuwjoo.myhome.module.udp

/**
 * UDP 通信配置常量。
 */
internal object UdpConfig {
    const val LISTEN_PORT = 8899 // 组播监听端口
    const val BROADCAST_PORT = 8899 // 组播发送端口
    const val MULTICAST_ADDR = "224.0.0.100" // 组播地址

    const val SCAN_COUNT = 3 // 设备扫描次数
    const val SCAN_INTERVAL = 1000L // 扫描间隔（毫秒）
    const val TOPIC_SCAN_DEVICES = "YHome/cmd/scanDevices" // 扫描设备主题
    const val TOPIC_LOCAL_DEVICE = "YHome/data/localDevice" // 本地设备信息主题

    val deviceName: String = "${android.os.Build.MANUFACTURER}-${android.os.Build.MODEL}" // 本机设备名称
    val deviceTopics: List<String> = emptyList() // 本机设备订阅的主题列表
}
