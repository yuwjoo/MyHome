package com.yuwjoo.myhome.module.udp

import android.util.Log

/**
 * 心跳管理器，定期向所有在线设备发送心跳包以维持在线状态感知。
 *
 * 使用方式：
 * ```kotlin
 * val heartbeat = HeartbeatManager(deviceManager, udpClient)
 * heartbeat.start()
 * // ...
 * heartbeat.stop()
 * ```
 */
class HeartbeatManager(
    /** 设备管理器，维护在线设备记录 */
    private val deviceManager: DeviceManager,
    /** UDP 客户端，发送心跳消息 */
    private val udpClient: UdpClient,
    /** 心跳主题 */
    private val heartbeatTopic: String = UdpConfig.HEARTBEAT_TOPIC,
    /** 心跳间隔（毫秒） */
    private val intervalMs: Long = UdpConfig.HEARTBEAT_INTERVAL,
    /** 设备离线超时（毫秒），超过该时间未收到心跳响应则标记为离线 */
    private val offlineTimeoutMs: Long = UdpConfig.HEARTBEAT_OFFLINE_TIMEOUT,
) {
    companion object {
        private const val TAG = "HeartbeatManager"
    }

    private var heartbeatThread: Thread? = null

    @Volatile
    private var running = false

    /** 心跳是否正在运行 */
    val isRunning: Boolean get() = running

    /**
     * 启动心跳，每隔 [intervalMs] 毫秒向所有在线设备发送心跳包，
     * 同时清理超时未响应的设备。
     * 如果已在运行则忽略。
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
        Log.d(TAG, "heartbeat started, interval=${intervalMs}ms topic=$heartbeatTopic timeout=${offlineTimeoutMs}ms")
    }

    /**
     * 停止心跳，中断后台线程。
     * 如果未在运行则忽略。
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
     * 向所有在线设备发送心跳包。
     */
    private fun sendHeartbeats() {
        val onlineDevices = deviceManager.onlineDeviceList
        if (onlineDevices.isEmpty()) return
        val data = TopicManager.buildMessage(heartbeatTopic, null)
        for (device in onlineDevices) {
            if (!running) break
            try {
                udpClient.send(data, device.ipAddress)
            } catch (e: Exception) {
                Log.e(TAG, "send heartbeat to ${device.ipAddress} failed: ${e.message}", e)
            }
        }
    }

    /**
     * 检测超时未响应心跳的设备，将其标记为离线。
     */
    private fun detectOfflineDevices() {
        val cutoff = System.currentTimeMillis() - offlineTimeoutMs
        val staleDevices = deviceManager.onlineDeviceList.filter {
            it.lastHeartbeatTime > 0 && it.lastHeartbeatTime < cutoff
        }
        for (device in staleDevices) {
            Log.w(TAG, "device ${device.ipAddress} heartbeat timeout (last=${device.lastHeartbeatTime}, cutoff=$cutoff), marking offline")
            deviceManager.markOffline(device.ipAddress)
        }
    }
}
