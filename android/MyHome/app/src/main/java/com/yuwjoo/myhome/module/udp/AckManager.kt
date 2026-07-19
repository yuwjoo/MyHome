package com.yuwjoo.myhome.module.udp

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

/**
 * Ack 确认及指数递增重传管理
 */
internal class AckManager(
    private val onRetry: (ip: String, data: ByteArray) -> Unit,
    private val onFailed: (ip: String, seqNum: Int) -> Unit
) {

    private var scope: CoroutineScope? = null
    private val pending = ConcurrentHashMap<String, PendingEntry>()

    /**
     * 启动，创建重传协程作用域
     */
    fun start() {
        if (scope != null) return
        scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    }

    /**
     * 停止，取消所有重传并销毁作用域
     */
    fun stop() {
        scope?.cancel()
        scope = null
        pending.clear()
    }

    /**
     * 注册待确认消息，启动重传定时器
     *
     * @param ip      目标 IP
     * @param seqNum  消息序号
     * @param rawData 完整帧数据，用于重传
     */
    fun register(ip: String, seqNum: Int, rawData: ByteArray) {
        val currentScope = scope ?: return
        val key = makeKey(ip, seqNum)
        val job = currentScope.launch {
            var retry = 0
            var waitMs = UdpConfig.ACK_BASE_TIMEOUT
            while (retry <= UdpConfig.ACK_MAX_RETRIES) {
                delay(waitMs)
                if (!pending.containsKey(key)) return@launch // 已被 ack 移除
                retry++
                if (retry > UdpConfig.ACK_MAX_RETRIES) {
                    pending.remove(key)
                    onFailed(ip, seqNum)
                    return@launch
                }
                onRetry(ip, rawData)
                waitMs = (waitMs * UdpConfig.ACK_BACKOFF_MULTIPLIER).coerceAtMost(5000)
            }
        }
        pending[key] = PendingEntry(seqNum, rawData, job)
    }

    /**
     * 收到 Ack 后移除对应条目
     *
     * @param ip     发送方 IP
     * @param ackSeq 被确认的消息序号
     */
    fun onAck(ip: String, ackSeq: Int): Boolean {
        val key = makeKey(ip, ackSeq)
        val entry = pending.remove(key) ?: return false
        entry.job.cancel()
        return true
    }

    private fun makeKey(ip: String, seqNum: Int) = "$ip:$seqNum"

    /**
     * 待确认消息条目
     */
    private data class PendingEntry(
        val seqNum: Int, // 消息序号
        val rawData: ByteArray, // 完整帧数据，用于重传
        val job: Job // 重传协程
    )
}
