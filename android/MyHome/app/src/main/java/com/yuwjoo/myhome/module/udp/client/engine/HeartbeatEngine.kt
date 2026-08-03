package com.yuwjoo.myhome.module.udp.client.engine

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig
import com.yuwjoo.myhome.module.udp.client.config.LocalConfig
import com.yuwjoo.myhome.module.udp.client.device.DeviceRegistry
import com.yuwjoo.myhome.module.udp.client.codec.FrameCodec
import com.yuwjoo.myhome.module.udp.client.transport.UdpSocket
import com.yuwjoo.myhome.module.udp.client.UdpDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * 心跳引擎：定时广播心跳帧并检测离线设备
 */
internal class HeartbeatEngine(
    private val deviceRegistry: DeviceRegistry,
    private val udpSocket: UdpSocket,
    private val intervalMs: Long = LocalConfig.HEARTBEAT_INTERVAL_MS,
) {
    companion object {
        private const val TAG = "HeartbeatEngine"
    }

    private val scope = CoroutineScope(SupervisorJob() + UdpDispatcher) // 单线程串行调度器
    private var job: Job? = null // 心跳协程 Job

    /** 各设备最近一次心跳接收时间（ip → timestamp） */
    private val heartbeatTimes = HashMap<String, Long>()

    /**
     * 记录收到某设备的心跳时间
     *
     * @param ip 设备 IP
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
            type = FrameConfig.Type.HEARTBEAT,
            seqNum = 0,
            flags = FrameConfig.Flags.NONE,
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
            val timeout = if (device.heartbeatTimeout > 0) device.heartbeatTimeout else LocalConfig.HEARTBEAT_TIMEOUT_MS
            if ((now - lastHb) > timeout) {
                deviceRegistry.markOffline(device.ip)
                Log.d(TAG, "Device offline detected: ${device.ip}")
            }
        }
    }
}
