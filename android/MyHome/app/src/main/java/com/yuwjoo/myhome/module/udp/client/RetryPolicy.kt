package com.yuwjoo.myhome.module.udp.client

/**
 * ACK 重试策略：不限制重试次数，仅通过最大超时时间防止退避爆炸
 *
 * @param baseTimeoutMs    初始超时（毫秒）
 * @param backoffMultiplier 退避倍数
 * @param maxTimeoutMs     最大重试间隔（毫秒），退避上限
 */
internal data class RetryPolicy(
    val baseTimeoutMs: Long = 150L,
    val backoffMultiplier: Int = 2,
    val maxTimeoutMs: Long = 5_000L,
) {
    /**
     * 计算第 [retryIndex] 次（0-based）重试的超时时间，有上限无次数限制
     */
    fun timeoutFor(retryIndex: Int): Long {
        var timeout = baseTimeoutMs
        var i = 0
        while (i < retryIndex && timeout < maxTimeoutMs) {
            val next = timeout * backoffMultiplier
            timeout = if (next > maxTimeoutMs || next < timeout) maxTimeoutMs else next
            i++
        }
        return timeout
    }
}
