package com.yuwjoo.myhome.module.udp.client

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

/**
 * ACK 确认引擎：按主机串行发送有序消息，前一条收到 ACK 后才发送下一条
 *
 * - 无限重试直到 ACK 或设备离线（重试间隔受 [RetryPolicy.maxTimeoutMs] 上限约束）
 * - 设备离线时清空对应主机的所有待发和正在发送的消息
 * - 序号策略：成功序号+1，失败（因离线中断）复用序号
 *
 * @param udpSocket   UDP Socket（用于单播发送）
 * @param retryPolicy 重试策略
 */
internal class AckEngine(
    private val seqManager: SeqManager,
    private val retryPolicy: RetryPolicy = RetryPolicy(),
    private val udpSocket: UdpSocket,
) {
    companion object {
        private const val TAG = "AckEngine"
        private const val ACK_POLL_MS = 50L
    }

    private val senders = ConcurrentHashMap<Int, HostSender>()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * 将消息加入发送队列，由对应主机的串行协程负责发送
     *
     * @param hostId     主机 ID
     * @param targetIp   目标 IP
     * @param buildFrame 帧构建函数（由 AckEngine 传入序号后构建完整帧）
     * @param onSuccess  ACK 确认后回调
     * @param onFailure  中断（离线/断开）后回调
     */
    fun enqueue(
        hostId: Int,
        targetIp: String,
        buildFrame: (seqNum: Int) -> ByteArray,
        onSuccess: (() -> Unit)? = null,
        onFailure: (() -> Unit)? = null,
    ) {
        val sender = senders.getOrPut(hostId) { HostSender(hostId) }
        sender.enqueue(SendTask(targetIp, buildFrame, onSuccess, onFailure))
    }

    /**
     * 收到远端 ACK 帧，通知对应主机的发送协程
     */
    fun onAck(hostId: Int, seqNum: Int) {
        senders[hostId]?.onAck(seqNum)
    }

    /**
     * 设备离线：中断当前发送并清空该主机的所有待发消息
     */
    fun abort(hostId: Int) {
        val sender = senders.remove(hostId)
        sender?.abort()
        Log.d(TAG, "Aborted sender for hostId=$hostId")
    }

    /**
     * 停止所有发送协程
     */
    fun stop() {
        senders.values.forEach { it.abort() }
        senders.clear()
        Log.i(TAG, "AckEngine stopped")
    }

    private inner class HostSender(private val hostId: Int) {
        private val queue = Channel<SendTask>(Channel.UNLIMITED)
        @Volatile private var job: Job? = null
        @Volatile private var ackedSeq: Int = -1
        @Volatile private var stopped = false
        @Volatile private var currentTask: SendTask? = null
        private var seqAllocated = false

        fun enqueue(task: SendTask) {
            if (stopped) return
            queue.trySend(task)
            startIfNeeded()
        }

        fun onAck(seqNum: Int) {
            ackedSeq = seqNum
        }

        /**
         * 中断发送：取消协程 → 回退序号 → 通知当前任务及所有排队任务失败
         */
        fun abort() {
            stopped = true
            job?.cancel()
            if (seqAllocated) {
                seqManager.rollbackSendSeq(hostId)
                seqAllocated = false
            }
            currentTask?.onFailure?.invoke()
            while (true) {
                val task = queue.tryReceive().getOrNull() ?: break
                task.onFailure?.invoke()
            }
            queue.close()
        }

        private fun startIfNeeded() {
            if (job == null || job?.isActive != true) {
                job = scope.launch { run() }
            }
        }

        /**
         * 串行消费队列：取出 → 分配序号 → 发送 → 无限等待 ACK → 下一条
         */
        private suspend fun run() {
            for (task in queue) {
                if (!isActive) break

                ackedSeq = -1
                currentTask = task
                val seq = seqManager.nextSendSeq(hostId)
                seqAllocated = true

                val frame = task.buildFrame(seq)
                udpSocket.sendUnicast(frame, task.targetIp)
                Log.d(TAG, "Sent ordered msg: hostId=$hostId seq=$seq")

                var retryIndex = 0
                while (isActive) {
                    val timeout = retryPolicy.timeoutFor(retryIndex)
                    val acked = waitForAck(seq, timeout)
                    if (acked) {
                        Log.d(TAG, "Ack confirmed: hostId=$hostId seq=$seq")
                        task.onSuccess?.invoke()
                        break
                    }
                    if (!isActive) break

                    Log.d(TAG, "Retry #${retryIndex + 1} for hostId=$hostId seq=$seq, timeout=${timeout}ms")
                    udpSocket.sendUnicast(frame, task.targetIp)
                    retryIndex++
                }

                seqAllocated = false
                currentTask = null
            }
        }

        private suspend fun waitForAck(expectedSeq: Int, timeoutMs: Long): Boolean {
            val deadline = System.currentTimeMillis() + timeoutMs
            while (System.currentTimeMillis() < deadline) {
                if (ackedSeq == expectedSeq) return true
                if (!isActive) return false
                delay(ACK_POLL_MS)
            }
            return false
        }
    }

    private class SendTask(
        val targetIp: String,
        val buildFrame: (seqNum: Int) -> ByteArray,
        val onSuccess: (() -> Unit)?,
        val onFailure: (() -> Unit)?,
    )
}
