package com.yuwjoo.myhome.module.updater.utils

/**
 * 版本工具类
 */
object VersionUtils {

    private const val MAJOR_WEIGHT = 1_000_000 // 主版本号权重
    private const val MINOR_WEIGHT = 1_000 // 次版本号权重
    private const val PATCH_WEIGHT = 1 // 补丁版本号权重
    private val WEIGHTS = intArrayOf(MAJOR_WEIGHT, MINOR_WEIGHT, PATCH_WEIGHT) // 段位权重数组

    /**
     * 获取版本 code
     *
     * @param version 版本号字符串，格式如 "0.0.19"
     * @return 版本 code
     */
    fun getVersionCode(version: String): Int {
        if (version.isBlank()) return -1

        val parts = version.split(".")
        if (parts.isEmpty()) return -1

        var code = 0
        for (i in parts.indices) {
            val num = parts[i].toIntOrNull() ?: return -1
            val weight = if (i < WEIGHTS.size) WEIGHTS[i] else PATCH_WEIGHT
            code += num * weight
        }
        return code
    }

    /**
     * 比较两个版本号
     *
     * @param a 版本号 A
     * @param b 版本号 B
     * @return -1 表示 a < b，0 表示相等，1 表示 a > b
     */
    fun compareVersion(a: String, b: String): Int {
        val codeA = getVersionCode(a)
        val codeB = getVersionCode(b)
        return codeA.compareTo(codeB)
    }
}
