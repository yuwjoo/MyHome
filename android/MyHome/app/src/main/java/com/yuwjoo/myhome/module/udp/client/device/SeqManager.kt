package com.yuwjoo.myhome.module.udp.client.device



/**
 * 序号管理：按主机号维护对端有序序号，严格递增校验（uint16 回绕）
 */
internal class SeqManager {

    private val recvSeqs = HashMap<Int, Int>() // hostId -> 本机已从该主机接收的最大有序序号
    private val sendSeqs = HashMap<Int, Int>() // hostId -> 本机已发给该主机的最大有序序号

    /**
     * 获取本机已从指定主机接收的最大序号
     *
     * @param hostId 主机 ID
     * @return 最大接收序号
     */
    fun getRecvSeq(hostId: Int): Int = recvSeqs.getOrDefault(hostId, 0)

    /**
     * 通过 Call/Answer 交换，用对端提供的起始序号初始化本机发送基线
     *
     * @param hostId 主机 ID
     * @param latestSeq 对端提供的最新序号
     */
    fun initSendSeq(hostId: Int, latestSeq: Int) {
        sendSeqs[hostId] = latestSeq // 下次发送从此 +1
    }

    /**
     * 消费校验结果
     */
    enum class Result {
        ACCEPTED,        // seq == expected，接受消息
        DISCARD_BUT_ACK, // seq 在 expected 之前，重复消息，丢弃但需回 Ack
        DISCARD_NO_ACK   // seq 在 expected 之后，乱序消息，丢弃且不回 Ack
    }

    /**
     * 尝试消费有序消息序号（uint16 回绕安全）
     *
     * @param hostId 主机 ID
     * @param seq 待校验的序号
     * @return ACCEPTED（消费成功）/ DISCARD_BUT_ACK（重复，回 Ack）/ DISCARD_NO_ACK（乱序，无视）
     */
    fun tryConsume(hostId: Int, seq: Int): Result {
        val recv = recvSeqs.getOrDefault(hostId, 0)
        val expected = (recv + 1) and 0xFFFF // uint16 回绕：0xFFFF + 1 → 0
        val gap = (expected - seq) and 0xFFFF // 从 seq 到 expected 的环上距离
        return when {
            gap == 0 -> {
                recvSeqs[hostId] = seq
                Result.ACCEPTED
            }
            gap in 1..0x7FFF -> Result.DISCARD_BUT_ACK // seq 在 expected 之前（重复）
            else -> Result.DISCARD_NO_ACK               // seq 在 expected 之后（跳号）
        }
    }

    /**
     * 获取下一个发送序号（uint16 回绕安全）
     *
     * @param hostId 主机 ID
     * @return 下一个发送序号
     */
    fun nextSendSeq(hostId: Int): Int {
        val current = sendSeqs.getOrDefault(hostId, 0)
        val next = (current + 1) and 0xFFFF
        sendSeqs[hostId] = next
        return next
    }

    /**
     * 回退发送序号（用于 ACK 引擎 abort 时将已分配但未完成的序号放回）
     *
     * @param hostId 主机 ID
     */
    fun rollbackSendSeq(hostId: Int) {
        val current = sendSeqs[hostId] ?: return
        sendSeqs[hostId] = (current - 1) and 0xFFFF
    }

    /**
     * 清理指定主机的序号记录
     *
     * @param hostId 主机 ID
     */
    fun clear(hostId: Int) {
        recvSeqs.remove(hostId)
        sendSeqs.remove(hostId)
    }

    /**
     * 重置所有序号
     */
    fun reset() {
        recvSeqs.clear()
        sendSeqs.clear()
    }
}
