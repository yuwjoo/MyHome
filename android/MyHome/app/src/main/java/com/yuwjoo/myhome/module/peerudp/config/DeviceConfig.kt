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
        const val SEND_TIMEOUT_MS = 300L // 发送超时时间（毫秒）：等待确认超时
        const val BACKOFF_BASE_MS = 300L // 指数退避基础间隔（毫秒）
        const val BACKOFF_MAX_MS = 10_000L // 指数退避最大间隔（毫秒）

        /**
         * 计算指定发送次数下的退避延迟（指数退避，封顶 [BACKOFF_MAX_MS]）
         *
         * @param sendCount 已发送次数（含首次发送）
         * @return 退避延迟（毫秒），首次发送后返回 0
         */
        fun backoffDelay(sendCount: Int): Long {
            if (sendCount <= 1) return 0L
            var delay = BACKOFF_BASE_MS
            repeat(sendCount - 2) { delay = minOf(delay * 2, BACKOFF_MAX_MS) }
            return delay
        }
    }
}
