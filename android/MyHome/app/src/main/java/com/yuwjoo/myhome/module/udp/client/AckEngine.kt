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
 * ACK 确认引擎：管理待确认消息，按重试策略自动重传，超时回调通知
 *
 * @param retryPolicy 重试策略
 * @param onRetry     重传回调（targetIp, rawFrame）
 * @param onTimeout   超时回调（targetIp, seqNum）
 */
internal class AckEngine(
    private val retryPolicy: RetryPolicy = RetryPolicy(),
    private val onRetry: ((targetIp: String, rawFrame: ByteArray) -> Unit)? = null,
    private val onTimeout: ((targetIp: String, seqNum: Int) -> Unit)? = null,
) {
    companion object {
        private const val TAG = "AckEngine"
    }

    private val pending = ConcurrentHashMap<String, ConcurrentHashMap<Int, AckItem>>() // 待确认消息：IP -> (seqNum -> AckItem)
    private val frameCache = ConcurrentHashMap<String, ConcurrentHashMap<Int, ByteArray>>() // 待重传原始帧缓存：IP -> (seqNum -> rawFrame)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 协程作用域

    /**
     * 注册一条需要 ACK 的消息
     *
     * @param ip       目标 IP
     * @param seqNum   发送时的序号
     * @param rawFrame 原始帧字节（用于重传）
     */
    fun register(ip: String, seqNum: Int, rawFrame: ByteArray) {
        val item = AckItem(ip = ip, seqNum = seqNum)
        pending.getOrPut(ip) { ConcurrentHashMap() }[seqNum] = item
        frameCache.getOrPut(ip) { ConcurrentHashMap() }[seqNum] = rawFrame

        val startTime = System.currentTimeMillis()
        item.job = scope.launch {
            var retryIndex = 0
            while (isActive && retryIndex <= retryPolicy.maxRetries) {
                val timeout = retryPolicy.timeoutFor(retryIndex)
                val elapsed = System.currentTimeMillis() - startTime
                val remaining = timeout - elapsed
                if (remaining > 0) delay(remaining)

                if (!isActive) break

                // 检查是否已确认
                if (item.confirmed) {
                    cleanup(ip, seqNum)
                    return@launch
                }

                if (retryIndex < retryPolicy.maxRetries) {
                    Log.d(TAG, "Retry #$retryIndex for $ip seq=$seqNum")
                    // 重新发送原帧
                    frameCache[ip]?.get(seqNum)?.let { onRetry?.invoke(ip, it) }
                } else {
                    // 超过最大重试
                    Log.w(TAG, "Ack timeout: $ip seq=$seqNum")
                    onTimeout?.invoke(ip, seqNum)
                    cleanup(ip, seqNum)
                }
                retryIndex++
            }
        }
    }

    /**
     * 收到 ACK，确认消息
     *
     * @param ip     来源 IP
     * @param seqNum 被确认的序号
     * @return true 如果存在对应的待确认条目
     */
    fun onAck(ip: String, seqNum: Int): Boolean {
        val item = pending[ip]?.get(seqNum) ?: return false
        item.confirmed = true
        item.job?.cancel()
        Log.d(TAG, "Ack confirmed: $ip seq=$seqNum")
        cleanup(ip, seqNum)
        return true
    }

    /**
     * 是否有待确认消息
     */
    fun hasPending(): Boolean {
        return pending.values.any { it.isNotEmpty() }
    }

    /**
     * 停止引擎，取消所有重试
     */
    fun stop() {
        pending.values.forEach { map ->
            map.values.forEach { it.job?.cancel() }
        }
        pending.clear()
        frameCache.clear()
        Log.i(TAG, "AckEngine stopped")
    }

    private fun cleanup(ip: String, seqNum: Int) {
        pending[ip]?.remove(seqNum)
        if (pending[ip]?.isEmpty() == true) pending.remove(ip)
        frameCache[ip]?.remove(seqNum)
        if (frameCache[ip]?.isEmpty() == true) frameCache.remove(ip)
    }

    private class AckItem(
        val ip: String,
        val seqNum: Int,
    ) {
        @Volatile var confirmed = false // 是否已收到 ACK 确认
        var job: Job? = null // 重试协程 Job
    }
}
