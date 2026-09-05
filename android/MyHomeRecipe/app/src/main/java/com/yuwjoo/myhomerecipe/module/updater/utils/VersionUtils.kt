package com.yuwjoo.myhomerecipe.module.updater.utils

/**
 * 版本号工具
 *
 * 支持 "x.y.z" 格式的语义化版本比较（三段权重 10^6 / 10^3 / 1），
 * 超过三段的部分按补丁级别累加，非法/空版本返回 -1（视为最小版本）。
 */
object VersionUtils {

    private val WEIGHTS = intArrayOf(1_000_000, 1_000, 1)

    /**
     * 将版本号转换为可比较的整型 code
     *
     * @param version 版本号，如 "0.0.19"
     * @return 版本 code；非法或空版本返回 -1
     */
    fun getVersionCode(version: String): Int {
        if (version.isBlank()) return -1

        val parts = version.split(".")
        var code = 0
        for ((index, part) in parts.withIndex()) {
            val num = part.toIntOrNull() ?: return -1
            val weight = if (index < WEIGHTS.size) WEIGHTS[index] else WEIGHTS.last()
            code += num * weight
        }
        return code
    }

    /**
     * 比较两个版本号
     *
     * @return 负数表示 a < b，0 表示相等，正数表示 a > b
     */
    fun compareVersion(a: String, b: String): Int =
        getVersionCode(a).compareTo(getVersionCode(b))
}
