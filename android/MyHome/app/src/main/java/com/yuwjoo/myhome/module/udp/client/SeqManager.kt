package com.yuwjoo.myhome.module.udp.client

import java.util.concurrent.ConcurrentHashMap

/**
 * 序号管理：按设备 IP 维护收发序号，支持发送序号递增、接收序号去重
 *
 * - 收到有序帧时，通过 [isDuplicate] 检查重复
 * - 单 IP 缓存上限 [MAX_RECEIVED_SEQS_SIZE]，超限自动清空
 */
internal class SeqManager {

    companion object {
        private const val MAX_RECEIVED_SEQS_SIZE = 10_000 // 单 IP 接收序号集合最大容量（超限清空防内存泄漏）
    }

    private val sendSeqs = ConcurrentHashMap<String, Int>() // 每 IP 的发送序号（自增）
    private val receivedSeqs = ConcurrentHashMap<String, MutableSet<Int>>() // 每 IP 已收到的序号集合（去重）

    /**
     * 获取指定 IP 的下一个发送序号（递增后返回）
     *
     * @param ip 设备 IP
     */
    fun nextSendSeq(ip: String): Int {
        return sendSeqs.merge(ip, 1) { _, seq -> seq + 1 }
    }

    /**
     * 检查指定 IP + 序号是否已接收过（去重）
     *
     * @return true 表示是重复消息
     */
    fun isDuplicate(ip: String, seqNum: Int): Boolean {
        val set = receivedSeqs.getOrPut(ip) { ConcurrentHashMap.newKeySet() }
        // 防止无限增长：超过上限清空该 IP 缓存
        if (set.size > MAX_RECEIVED_SEQS_SIZE) {
            set.clear()
        }
        return !set.add(seqNum)
    }

    /**
     * 获取指定 IP 当前已记录的接收序号集合（快照，调试用）
     */
    fun getReceivedSeqs(ip: String): Set<Int> {
        return receivedSeqs[ip]?.toSet() ?: emptySet()
    }

    /**
     * 清理指定 IP 的序号记录
     */
    fun clear(ip: String) {
        sendSeqs.remove(ip)
        receivedSeqs.remove(ip)
    }

    /**
     * 重置所有序号
     */
    fun reset() {
        sendSeqs.clear()
        receivedSeqs.clear()
    }
}
