package com.yuwjoo.myhome.module.udpcomm.device

import com.yuwjoo.myhome.module.udpcomm.config.DeviceConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * 设备存活检测
 */
class DeviceAliveChecker(
    private val getOnlineDevices: () -> List<LanDevice>, // 获取在线设备列表
    private val onDeviceOffline: (LanDevice) -> Unit, // 设备离线回调
) {
    private val scope = CoroutineScope(Dispatchers.IO) // 内部协程作用域
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
        for (device in getOnlineDevices()) {
            val timeout = if (device.heartbeatTimeout > 0) device.heartbeatTimeout else DeviceConfig.Local.HEARTBEAT_TIMEOUT_MS
            if (now - device.lastHeartbeat > timeout) {
                onDeviceOffline(device)
            }
        }
    }
}
