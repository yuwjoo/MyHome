package com.yuwjoo.myhome.module.mqtt

import java.util.LinkedList

/**
 * 断连期间暂存的消息队列，FIFO，最多保留最近 [maxSize] 条。
 */
class PendingMessageQueue(private val maxSize: Int = 10) {

    private val queue = object : LinkedList<PendingMessage>() {
        override fun add(element: PendingMessage): Boolean {
            while (size >= maxSize) removeFirst()
            return super.add(element)
        }
    }

    /**
     * 添加一条暂存消息，超出上限时自动丢弃最旧的
     */
    @Synchronized
    fun enqueue(message: PendingMessage) {
        queue.add(message)
    }

    /**
     * 取出并清空所有暂存消息（按入队顺序）
     */
    @Synchronized
    fun drain(): List<PendingMessage> {
        val copy = queue.toList()
        queue.clear()
        return copy
    }

    val isEmpty: Boolean
        @Synchronized get() = queue.isEmpty()

    val size: Int
        @Synchronized get() = queue.size
}

data class PendingMessage(
    val topic: String, // 主题
    val payload: String, // 消息内容
    val qos: Int, // 服务质量
    val retained: Boolean, // 是否保留
)
