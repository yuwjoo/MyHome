package com.yuwjoo.myhome.module.update

import android.util.Log
import com.yuwjoo.myhome.config.AppConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

/**
 * 版本检查器
 *
 * 负责请求远程版本清单，并与本地版本进行比较，
 * 判断是否需要更新 Web 资源。
 */
object VersionChecker {

    private const val TAG = "VersionChecker"

    /** OkHttp 客户端实例 */
    private val client = OkHttpClient.Builder()
        .followRedirects(true)
        .build()

    /**
     * 版本比较结果
     */
    sealed class VersionCheckResult {
        /** 需要更新，携带远程最新 Web 版本号和 Android 版本号（可能为 null） */
        data class UpdateAvailable(
            val remoteVersion: String,
            val androidVersion: String? = null,
        ) : VersionCheckResult()

        /** 已是最新版本，携带 Android 版本号（可能为 null） */
        data class UpToDate(val androidVersion: String? = null) : VersionCheckResult()

        /** 检查失败（网络错误、解析错误等） */
        data class Error(val message: String) : VersionCheckResult()
    }

    /**
     * 检查是否需要更新 Web 资源
     *
     * @param localVersion 本地 Web 资源版本号，null 表示本地无资源
     * @return 版本检查结果
     */
    suspend fun checkForUpdate(localVersion: String?): VersionCheckResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "开始检查版本更新，本地版本: ${localVersion ?: "无"}")

            // 请求远程版本清单
            val request = Request.Builder().url(AppConfig.VERSION_MANIFEST_URL).build()
            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                return@withContext VersionCheckResult.Error(
                    "获取版本清单失败，HTTP ${response.code}"
                )
            }

            val body = response.body?.string() ?: return@withContext VersionCheckResult.Error("响应体为空")
            val manifest = JSONObject(body)

            // 解析 web -> my-home-mobile 版本
            val webObj = manifest.optJSONObject(AppConfig.MANIFEST_KEY_WEB)
                ?: return@withContext VersionCheckResult.Error("版本清单中缺少 web 字段")

            val remoteVersion = webObj.optString(AppConfig.MANIFEST_KEY_MY_HOME_MOBILE, null)
                ?: return@withContext VersionCheckResult.Error("版本清单中缺少 my-home-mobile 字段")

            // 解析 android -> MyHome 版本（可选，不存在则不返回）
            val androidObj = manifest.optJSONObject(AppConfig.MANIFEST_KEY_ANDROID)
            val androidVersion = androidObj?.optString(AppConfig.MANIFEST_KEY_ANDROID_MYHOME, null)

            Log.d(TAG, "远程 Web 版本: $remoteVersion, Android 版本: ${androidVersion ?: "无"}")

            // 本地无资源 -> 需要下载
            if (localVersion == null) {
                return@withContext VersionCheckResult.UpdateAvailable(remoteVersion, androidVersion)
            }

            // 比较版本号
            if (compareVersions(remoteVersion, localVersion) > 0) {
                Log.d(TAG, "发现新版本: $localVersion -> $remoteVersion")
                VersionCheckResult.UpdateAvailable(remoteVersion, androidVersion)
            } else {
                Log.d(TAG, "已是最新版本")
                VersionCheckResult.UpToDate(androidVersion)
            }
        } catch (e: Exception) {
            Log.e(TAG, "版本检查异常: ${e.message}", e)
            VersionCheckResult.Error(e.message ?: "未知错误")
        }
    }

    /**
     * 比较两个语义化版本号
     *
     * 支持格式: "0.0.1", "1.2.3" 等（仅数字用点分隔）
     *
     * @param v1 版本号 1
     * @param v2 版本号 2
     * @return v1 > v2 返回正数，v1 == v2 返回 0，v1 < v2 返回负数
     */
    fun compareVersions(v1: String, v2: String): Int {
        try {
            val parts1 = v1.split(".").map { it.toIntOrNull() ?: 0 }
            val parts2 = v2.split(".").map { it.toIntOrNull() ?: 0 }
            val maxLen = maxOf(parts1.size, parts2.size)

            for (i in 0 until maxLen) {
                val p1 = parts1.getOrElse(i) { 0 }
                val p2 = parts2.getOrElse(i) { 0 }
                if (p1 != p2) return p1 - p2
            }
            return 0
        } catch (e: Exception) {
            // 解析失败时回退到字符串比较
            return v1.compareTo(v2)
        }
    }
}
