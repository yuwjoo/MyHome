package com.yuwjoo.myhome.module.peerudp.transport

import android.util.Log
import com.yuwjoo.myhome.module.peerudp.common.SerialCoroutine
import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * 消息发送状态
 */
enum class SendStatus {
    SUCCESS, // 发送成功（收到确认）
    FAILED, // 重试次数用尽，发送失败
    ABORT, // 消息被中止
}

/**
 * 消息任务
 *
 * @param data       待发送数据
 * @param seq        消息序号（入队时由调用方指定）
 * @param send       发送回调（发送数据到指定 IP，携带序号）
 * @param onDone 完成回调（消息处理结束时调用，参数为结果）
 */
class MessageTask(
    val data: ByteArray, // 待发送数据
    val seq: Int, // 消息序号
    val send: (data: ByteArray, ip: String, seq: Int) -> Unit, // 发送回调（含序号）
    val onDone: (status: SendStatus) -> Unit = {}, // 完成回调（可省略）
) {
    var sendCount: Int = 0 // 已发送次数
}

/**
 * 消息队列：按目标 IP 分组的有序消息发送队列，带超时重发与确认机制
 *
 * 与设备层解耦：不持有设备映射表，消息序号由调用方在入队时直接传入。
 */
internal class MessageQueue {

    companion object {
        private const val TAG = "MessageQueue"
    }

    private val queues = HashMap<String, ArrayDeque<MessageTask>>() // 各目标待发送队列
    private val sending = HashMap<String, MessageTask>() // 各目标发送中（等待确认/超时重发）的任务

    private val timeoutScope = CoroutineScope(Dispatchers.IO) // 超时定时作用域（IO 线程池，delay 不阻塞串行线程）

    /**
     * 向指定目标加入一条待发送消息
     *
     * @param ip         目标 IP
     * @param seq        消息序号（由调用方指定）
     * @param data       待发送数据
     * @param send       发送回调（发送数据到指定 IP，携带序号）
     * @param onDone 完成回调（消息处理结束时调用，参数为结果，可省略）
     */
    fun enqueue(
        ip: String,
        seq: Int,
        data: ByteArray,
        send: (data: ByteArray, ip: String, seq: Int) -> Unit,
        onDone: (status: SendStatus) -> Unit = {},
    ) {
        queues.getOrPut(ip) { ArrayDeque() }.addLast(MessageTask(data, seq, send, onDone))
        sendNext(ip)
    }

    /**
     * 确认消息已送达（收到对应序号的消息时调用）
     *
     * @param ip  目标 IP
     * @param seq 已送达的消息序号
     */
    fun ack(ip: String, seq: Int) {
        val task = sending[ip] ?: return
        if (task.seq != seq) return
        sending.remove(ip)
        task.onDone(SendStatus.SUCCESS)
        sendNext(ip)
    }

    /**
     * 中止待发送与发送中消息
     *
     * @param ip 目标 IP
     */
    fun abort(ip: String) {
        queues.remove(ip)?.forEach { it.onDone(SendStatus.ABORT) }
        sending.remove(ip)?.onDone(SendStatus.ABORT)
    }

    /**
     * 发送队首的下一条消息（串行协程中执行）
     */
    private fun sendNext(ip: String) {
        if (sending[ip] != null) return // 有发送中任务，等待确认或超时
        val queue = queues[ip] ?: return
        val task = queue.removeFirstOrNull()
        if (task == null) {
            queues.remove(ip) // 队列已空，清理空队列
            return
        }
        task.sendCount = 1
        sending[ip] = task
        task.send(task.data, ip, task.seq)
        startTimeout(ip, task)
    }

    /**
     * 启动消息发送超时定时（IO 线程池挂起等待，不阻塞串行线程）
     */
    private fun startTimeout(ip: String, task: MessageTask) {
        timeoutScope.launch {
            delay(DeviceConfig.MessageQueue.SEND_TIMEOUT_MS)
            SerialCoroutine.scope.launch { handleTimeout(ip, task) }
        }
    }

    /**
     * 处理发送超时：重发或丢弃（串行协程中执行）
     */
    private fun handleTimeout(ip: String, task: MessageTask) {
        if (sending[ip] !== task) return // 任务已被确认或替换，忽略过期定时
        if (task.sendCount >= DeviceConfig.MessageQueue.MAX_SEND_COUNT) {
            Log.w(TAG, "handleTimeout: drop message to $ip, seq=${task.seq}")
            sending.remove(ip)
            task.onDone(SendStatus.FAILED)
            sendNext(ip)
            return
        }
        task.sendCount++
        task.send(task.data, ip, task.seq)
        startTimeout(ip, task)
    }
}
