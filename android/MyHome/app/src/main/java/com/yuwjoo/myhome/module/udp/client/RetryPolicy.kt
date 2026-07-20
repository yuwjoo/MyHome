package com.yuwjoo.myhome.module.udp.client

/**
 * ACK 重试策略
 */
internal data class RetryPolicy(
    val baseTimeoutMs: Long = 150L, // 首次超时时间（毫秒）
    val maxRetries: Int = 5, // 最大重试次数
    val backoffMultiplier: Int = 2, // 退避倍数
    val maxTimeoutMs: Long = 5_000L, // 最大超时时间（毫秒，防止退避爆炸）
) {
    /**
     * 计算第 retryIndex 次（0-based）重试的超时时间
     */
    fun timeoutFor(retryIndex: Int): Long {
        var timeout = baseTimeoutMs
        repeat(retryIndex.coerceAtMost(maxRetries)) {
            timeout *= backoffMultiplier
        }
        return timeout.coerceAtMost(maxTimeoutMs)
    }
}
