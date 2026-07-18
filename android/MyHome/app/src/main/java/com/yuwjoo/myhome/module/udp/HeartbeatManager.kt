package com.yuwjoo.myhome.module.udp

import android.util.Log

/**
 * 心跳管理器
 */
class HeartbeatManager(
    private val deviceManager: DeviceManager, // 设备管理器
    private val udpClient: UdpClient, // UDP 客户端
    private val intervalMs: Long = UdpConfig.HEARTBEAT_INTERVAL, // 心跳间隔（毫秒）
    private val offlineTimeoutMs: Long = UdpConfig.HEARTBEAT_OFFLINE_TIMEOUT, // 设备离线超时（毫秒）
) {
    companion object {
        private const val TAG = "HeartbeatManager"
    }

    private var heartbeatThread: Thread? = null

    @Volatile
    private var running = false

    val isRunning: Boolean get() = running // 心跳是否正在运行

    /**
     * 启动心跳
     */
    fun start() {
        if (running) {
            Log.d(TAG, "heartbeat already running")
            return
        }
        running = true
        heartbeatThread = Thread({
            while (running && !Thread.currentThread().isInterrupted) {
                try {
                    sendHeartbeats()
                    detectOfflineDevices()
                } catch (e: Exception) {
                    Log.e(TAG, "heartbeat cycle error: ${e.message}", e)
                }
                try {
                    Thread.sleep(intervalMs)
                } catch (_: InterruptedException) {
                    break
                }
            }
        }, "udp-heartbeat").apply {
            isDaemon = true
            start()
        }
        Log.d(TAG, "heartbeat started, interval=${intervalMs}ms timeout=${offlineTimeoutMs}ms")
    }

    /**
     * 停止心跳
     */
    fun stop() {
        if (!running) {
            Log.d(TAG, "heartbeat not running")
            return
        }
        running = false
        heartbeatThread?.interrupt()
        heartbeatThread = null
        Log.d(TAG, "heartbeat stopped")
    }

    /**
     * 发送心跳包
     */
    private fun sendHeartbeats() {
        try {
            Log.d("UdpManager", "发送心跳")
            udpClient.sendBroadcast(byteArrayOf(0x01))
        } catch (e: Exception) {
            Log.e(TAG, "send heartbeat failed: ${e.message}", e)
        }
    }

    /**
     * 检测离线设备
     */
    private fun detectOfflineDevices() {
        val cutoff = System.currentTimeMillis() - offlineTimeoutMs
        for (device in deviceManager.onlineDeviceList) {
            if (device.lastHeartbeatTime > 0 && device.lastHeartbeatTime < cutoff) {
                Log.w(TAG, "device ${device.ipAddress} heartbeat timeout (last=${device.lastHeartbeatTime}, cutoff=$cutoff), marking offline")
                deviceManager.updateOnlineStatus(device.ipAddress, false)
            }
        }
    }
}
