package com.yuwjoo.myhome.module.peerudp.device

import android.util.Log
import com.yuwjoo.myhome.module.peerudp.common.SerialCoroutine
import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig
import com.yuwjoo.myhome.module.peerudp.transport.Transport
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * 设备消息任务
 */
class DeviceMessage(
    val data: ByteArray, // 待发送数据
) {
    var seq: Int = 0 // 分配的消息序号
    var sendCount: Int = 0 // 已发送次数
    var lastSendAt: Long = 0 // 最后发送时间戳（ms）
}

/**
 * 设备消息队列
 */
class DeviceMessageQueue(
    private val transport: Transport, // UDP 传输器
    private val deviceMap: HashMap<String, LanDevice>, // 设备映射表
) {
    companion object {
        private const val TAG = "DeviceMessageQueue"
    }

    private val queues = HashMap<String, ArrayDeque<DeviceMessage>>() // 各设备待发送队列
    private val sending = HashMap<String, DeviceMessage>() // 各设备发送中（等待确认/超时重发）的任务

    private val timeoutScope = CoroutineScope(Dispatchers.IO) // 超时定时作用域（IO 线程池，delay 不阻塞串行线程）

    /**
     * 向指定设备加入一条待发送消息
     *
     * @param ip   目标设备 IP
     * @param data 待发送数据
     */
    fun enqueue(ip: String, data: ByteArray) {
        queues.getOrPut(ip) { ArrayDeque() }.addLast(DeviceMessage(data))
        sendNext(ip)
    }

    /**
     * 确认设备消息已送达（收到对应序号的消息时调用）
     *
     * @param ip  设备 IP
     * @param seq 已送达的消息序号
     */
    fun confirm(ip: String, seq: Int) {
        val task = sending[ip] ?: return
        if (task.seq != seq) return
        sending.remove(ip)
        sendNext(ip)
    }

    /**
     * 移除设备的待发送与发送中消息
     *
     * @param ip 设备 IP
     */
    fun removeDevice(ip: String) {
        queues.remove(ip)
        sending.remove(ip)
    }

    /**
     * 发送设备队首的下一条消息（串行协程中执行）
     */
    private fun sendNext(ip: String) {
        if (sending[ip] != null) return // 有发送中任务，等待确认或超时
        val queue = queues[ip] ?: return
        val task = queue.removeFirstOrNull()
        if (task == null) {
            queues.remove(ip) // 队列已空，清理空队列
            return
        }
        val device = deviceMap[ip]
        if (device == null) {
            Log.w(TAG, "sendNext: device $ip not found, drop message")
            return
        }
        task.seq = device.nextSendSeq()
        task.sendCount = 1
        task.lastSendAt = System.currentTimeMillis()
        sending[ip] = task
        transport.sendUnicast(task.data, ip)
        device.updateSendSeq(task.seq)
        startTimeout(ip, task)
    }

    /**
     * 启动消息发送超时定时（IO 线程池挂起等待，不阻塞串行线程）
     */
    private fun startTimeout(ip: String, task: DeviceMessage) {
        timeoutScope.launch {
            delay(DeviceConfig.MessageQueue.SEND_TIMEOUT_MS)
            SerialCoroutine.scope.launch { handleTimeout(ip, task) }
        }
    }

    /**
     * 处理发送超时：重发或丢弃（串行协程中执行）
     */
    private fun handleTimeout(ip: String, task: DeviceMessage) {
        if (sending[ip] !== task) return // 任务已被确认或替换，忽略过期定时
        if (deviceMap[ip] == null) {
            Log.w(TAG, "handleTimeout: device $ip removed, drop message")
            sending.remove(ip)
            sendNext(ip)
            return
        }
        if (task.sendCount >= DeviceConfig.MessageQueue.MAX_SEND_COUNT) {
            Log.w(TAG, "handleTimeout: drop message to $ip, seq=${task.seq}")
            sending.remove(ip)
            sendNext(ip)
            return
        }
        task.sendCount++
        task.lastSendAt = System.currentTimeMillis()
        transport.sendUnicast(task.data, ip)
        startTimeout(ip, task)
    }
}
