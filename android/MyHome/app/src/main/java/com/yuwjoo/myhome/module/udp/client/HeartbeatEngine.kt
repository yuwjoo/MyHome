package com.yuwjoo.myhome.module.udp.client

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

/**
 * 心跳引擎：定时广播心跳帧并检测离线设备
 *
 * @param deviceRegistry  设备注册表（查询在线设备、标记离线）
 * @param udpSocket       UDP Socket（广播心跳帧）
 * @param intervalMs       心跳间隔（毫秒）
 */
internal class HeartbeatEngine(
    private val deviceRegistry: DeviceRegistry,
    private val udpSocket: UdpSocket,
    private val intervalMs: Long = ClientConfig.HEARTBEAT_INTERVAL_MS,
) {
    companion object {
        private const val TAG = "HeartbeatEngine"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 协程作用域
    private var job: Job? = null // 心跳协程 Job

    /** 各设备最近一次心跳接收时间（ip → timestamp） */
    private val heartbeatTimes = ConcurrentHashMap<String, Long>()

    /**
     * 记录收到某设备的心跳时间
     */
    fun recordHeartbeat(ip: String) {
        heartbeatTimes[ip] = System.currentTimeMillis()
    }

    /**
     * 启动心跳
     */
    fun start() {
        if (job != null) return
        job = scope.launch {
            Log.i(TAG, "Heartbeat started, interval=${intervalMs}ms")
            while (isActive) {
                // 广播心跳
                sendHeartbeat()

                // 检测离线设备
                detectOffline()

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
        heartbeatTimes.clear()
        Log.i(TAG, "Heartbeat stop requested")
    }

    /**
     * 编码并广播心跳帧
     */
    private fun sendHeartbeat() {
        val frame = FrameCodec.encode(
            type = ClientConfig.Type.HEARTBEAT,
            seqNum = 0,
            flags = ClientConfig.Flags.NONE,
            payload = ByteArray(0),
        )
        udpSocket.sendBroadcast(frame)
    }

    /**
     * 遍历在线设备，检查心跳是否超时，超时则标记离线
     */
    private fun detectOffline() {
        val now = System.currentTimeMillis()
        for (device in deviceRegistry.getOnline()) {
            val lastHb = heartbeatTimes[device.ip] ?: continue
            val timeout = if (device.heartbeatTimeout > 0) device.heartbeatTimeout else ClientConfig.HEARTBEAT_TIMEOUT_MS
            if ((now - lastHb) > timeout) {
                deviceRegistry.markOffline(device.ip)
                Log.d(TAG, "Device offline detected: ${device.ip}")
            }
        }
    }
}
