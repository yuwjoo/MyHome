package com.yuwjoo.myhome.module.peerudp.config

/**
 * 设备配置
 */
internal object DeviceConfig {
    const val ABILITY_PREFIX_TOPIC = "topic:" // 主题订阅能力前缀
    const val ABILITY_PREFIX_SKILL = "skill:" // 设备技能能力前缀

    object Local {
        const val HEARTBEAT_INTERVAL_MS = 1_500L // 本机心跳发送间隔（毫秒）
        const val HEARTBEAT_TIMEOUT_MS = 4_500L // 远程设备心跳超时阈值（毫秒）
        val DEVICE_NAME: String = "${android.os.Build.MANUFACTURER}-${android.os.Build.MODEL}" // 本机设备名称
        val DEVICE_ABILITIES: List<String> = emptyList() // 本机设备能力列表
    }

    object MessageQueue {
        const val SEND_TIMEOUT_MS = 300L // 发送超时时间（毫秒）
        const val MAX_SEND_COUNT = 3 // 单条消息最大发送次数（含首次发送）
    }
}
