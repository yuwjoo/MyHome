package com.yuwjoo.myhome.module.udp.client

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * 心跳引擎：定时广播心跳帧并检测离线设备
 *
 * @param onSendHeartbeat 发送心跳回调
 * @param onDetectOffline 离线检测回调
 * @param intervalMs      心跳间隔（毫秒）
 */
internal class HeartbeatEngine(
    private val onSendHeartbeat: (() -> Unit)? = null,
    private val onDetectOffline: (() -> Unit)? = null,
    private val intervalMs: Long = UdpConfig.HEARTBEAT_INTERVAL_MS,
) {
    companion object {
        private const val TAG = "HeartbeatEngine"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 协程作用域
    private var job: Job? = null // 心跳协程 Job

    /**
     * 启动心跳
     */
    fun start() {
        if (job != null) return
        job = scope.launch {
            Log.i(TAG, "Heartbeat started, interval=${intervalMs}ms")
            while (isActive) {
                // 广播心跳
                onSendHeartbeat?.invoke()

                // 检测离线设备（实际检测逻辑在 DeviceRegistry 中）
                onDetectOffline?.invoke()

                delay(intervalMs)
            }
            Log.i(TAG, "Heartbeat stopped")
        }
    }

    /**
     * 停止心跳
     */
    fun stop() {
        job?.cancel()
        job = null
        Log.i(TAG, "Heartbeat stop requested")
    }
}
