package com.yuwjoo.myhome.module.updater

/**
 * 版本工具类
 */
object VersionUtils {

    /** 主版本号权重 */
    private const val MAJOR_WEIGHT = 1_000_000

    /** 次版本号权重 */
    private const val MINOR_WEIGHT = 1_000

    /** 补丁版本号权重 */
    private const val PATCH_WEIGHT = 1

    /** 段位权重数组 */
    private val WEIGHTS = intArrayOf(MAJOR_WEIGHT, MINOR_WEIGHT, PATCH_WEIGHT)

    /**
     * 获取版本 code
     *
     * @param version 版本号字符串，格式如 "0.0.19"
     * @return 版本 code
     */
    fun getVersionCode(version: String): Int {
        require(version.isNotBlank()) { "版本号不能为空" }

        val parts = version.split(".")
        require(parts.isNotEmpty()) { "版本号格式不正确: $version" }

        var code = 0
        for (i in parts.indices) {
            val num = parts[i].toIntOrNull()
                ?: throw IllegalArgumentException("版本号段位不是有效数字: '${parts[i]}' (来自 $version)")
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
