package com.yuwjoo.myhome.module.peerudp.device

import com.yuwjoo.myhome.module.peerudp.SerialCoroutine
import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * 设备存活检测
 */
internal class DeviceAliveChecker(
    private val deviceMap: HashMap<String, LanDevice>, // 设备映射表
) {
    private val scope = CoroutineScope(Dispatchers.IO) // 存活检测作用域（IO 线程池）
    private var job: Job? = null // 当前检测任务

    /**
     * 启动存活检测
     */
    fun start() {
        if (job?.isActive == true) return
        job = scope.launch {
            while (isActive) {
                check()
                delay(DeviceConfig.Local.HEARTBEAT_INTERVAL_MS)
            }
        }
    }

    /**
     * 停止存活检测
     */
    fun stop() {
        job?.cancel()
        job = null
    }

    /**
     * 检测所有在线设备是否存活
     */
    private fun check() {
        val now = System.currentTimeMillis()
        for (device in deviceMap.values) {
            if (device.status != LanDeviceStatus.ONLINE) continue // 只检测在线设备
            if (now - device.lastHeartbeat > device.heartbeatTimeout) {
                SerialCoroutine.scope.launch { device.offline() } // 投递到串行协程执行离线
            }
        }
    }
}
