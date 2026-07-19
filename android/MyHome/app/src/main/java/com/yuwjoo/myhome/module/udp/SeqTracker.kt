package com.yuwjoo.myhome.module.udp

import java.util.concurrent.ConcurrentHashMap

/**
 * 按对端 IP 维护消息序号
 */
internal class SeqTracker {

    private val seqMap = ConcurrentHashMap<String, Int>()

    /**
     * 获取对端当前序号
     *
     * @param ip 对方 IP
     */
    fun currentSeq(ip: String): Int = seqMap.getOrDefault(ip, 1)

    /**
     * 递增并返回新序号
     *
     * @param ip 对方 IP
     */
    fun nextSeq(ip: String): Int {
        val next = seqMap.merge(ip, 1) { _, old -> old + 1 } ?: 1
        return next
    }

    /**
     * 从对端 latestSeq 初始化序号
     *
     * @param ip        对方 IP
     * @param latestSeq 对方最新序号
     */
    fun initFromPeer(ip: String, latestSeq: Int) {
        seqMap[ip] = latestSeq
    }

    /**
     * 检查并消费有序消息，返回处理结果
     *
     * @param ip     对方 IP
     * @param seqNum 消息序号
     */
    fun check(ip: String, seqNum: Int): SeqResult {
        val current = currentSeq(ip)
        return when {
            seqNum < current -> SeqResult.DUPLICATE
            seqNum == current -> {
                seqMap[ip] = current + 1
                SeqResult.CONSUMED
            }
            else -> SeqResult.FUTURE
        }
    }
}

enum class SeqResult {
    DUPLICATE, // 过期/重复消息，丢弃
    CONSUMED, // 期望的消息，已消费
    FUTURE // 未来消息，中间有丢包，丢弃
}
