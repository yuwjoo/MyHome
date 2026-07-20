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
 * ACK 确认引擎：管理待确认消息，按重试策略自动重传
 *
 * @param retryPolicy 重试策略
 * @param onRetry     重传回调（targetIp, rawFrame）
 * @param onTimeout   超时回调（hostId, seqNum）
 */
internal class AckEngine(
    private val retryPolicy: RetryPolicy = RetryPolicy(),
    private val onRetry: ((targetIp: String, rawFrame: ByteArray) -> Unit)? = null,
    private val onTimeout: ((hostId: Int, seqNum: Int) -> Unit)? = null,
) {
    companion object {
        private const val TAG = "AckEngine"
    }

    private val pending = ConcurrentHashMap<Int, ConcurrentHashMap<Int, AckItem>>() // hostId -> (seqNum -> AckItem)
    private val frameCache = ConcurrentHashMap<Int, ConcurrentHashMap<Int, ByteArray>>() // hostId -> (seqNum -> rawFrame)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO) // 协程作用域

    /**
     * 注册一条需要 ACK 的消息
     */
    fun register(hostId: Int, seqNum: Int, rawFrame: ByteArray, targetIp: String) {
        val item = AckItem(seqNum = seqNum, targetIp = targetIp)
        pending.getOrPut(hostId) { ConcurrentHashMap() }[seqNum] = item
        frameCache.getOrPut(hostId) { ConcurrentHashMap() }[seqNum] = rawFrame

        val startTime = System.currentTimeMillis()
        item.job = scope.launch {
            var retryIndex = 0
            while (isActive && retryIndex <= retryPolicy.maxRetries) {
                val timeout = retryPolicy.timeoutFor(retryIndex)
                val elapsed = System.currentTimeMillis() - startTime
                val remaining = timeout - elapsed
                if (remaining > 0) delay(remaining)

                if (!isActive) break

                if (item.confirmed) {
                    cleanup(hostId, seqNum)
                    return@launch
                }

                if (retryIndex < retryPolicy.maxRetries) {
                    Log.d(TAG, "Retry #$retryIndex for hostId=$hostId seq=$seqNum")
                    frameCache[hostId]?.get(seqNum)?.let { onRetry?.invoke(item.targetIp, it) }
                } else {
                    Log.w(TAG, "Ack timeout: hostId=$hostId seq=$seqNum")
                    onTimeout?.invoke(hostId, seqNum)
                    cleanup(hostId, seqNum)
                }
                retryIndex++
            }
        }
    }

    /**
     * 收到 ACK，确认消息
     */
    fun onAck(hostId: Int, seqNum: Int): Boolean {
        val item = pending[hostId]?.get(seqNum) ?: return false
        item.confirmed = true
        item.job?.cancel()
        Log.d(TAG, "Ack confirmed: hostId=$hostId seq=$seqNum")
        cleanup(hostId, seqNum)
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

    /**
     * 清理指定消息的待确认记录与帧缓存，若主机下已无待处理项则一并移除主机条目
     */
    private fun cleanup(hostId: Int, seqNum: Int) {
        pending[hostId]?.remove(seqNum)
        if (pending[hostId]?.isEmpty() == true) pending.remove(hostId)
        frameCache[hostId]?.remove(seqNum)
        if (frameCache[hostId]?.isEmpty() == true) frameCache.remove(hostId)
    }

    /**
     * 单条待确认消息记录，追踪 ACK 到达和重试协程
     */
    private class AckItem(
        val seqNum: Int, // 消息序号
        val targetIp: String, // 目标 IP
    ) {
        @Volatile var confirmed = false // 是否已收到 ACK 确认
        var job: Job? = null // 重试协程 Job
    }
}
