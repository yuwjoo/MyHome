package com.yuwjoo.myhome.module.updater

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

/**
 * 版本清单
 */
class VersionManifest {

    companion object {
        private const val TAG = "VersionManifest"

        private val client = OkHttpClient.Builder() // OkHttp 客户端实例，复用连接池
            .followRedirects(true)
            .build()
    }

    private var webVersion: String? = null // 缓存的 web 版本
    private var appVersion: String? = null // 缓存的应用版本
    private var fetched = false // 是否已拉取

    /**
     * 拉取版本清单
     */
    suspend fun fetch() = withContext(Dispatchers.IO) {
        if (fetched) return@withContext

        try {
            Log.d(TAG, "拉取版本清单: ${UpdaterConfig.VERSION_MANIFEST_URL}")

            val request = Request.Builder().url(UpdaterConfig.VERSION_MANIFEST_URL).build()
            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                Log.e(TAG, "拉取版本清单失败，HTTP ${response.code}")
                return@withContext
            }

            val body = response.body?.string() ?: run {
                Log.e(TAG, "响应体为空")
                return@withContext
            }

            val manifest = JSONObject(body)

            // 解析 web 版本
            val webObj = manifest.optJSONObject(UpdaterConfig.MANIFEST_KEY_WEB)
            webVersion = webObj?.optString(UpdaterConfig.MANIFEST_KEY_WEB_VERSION)?.takeIf { it.isNotEmpty() }

            // 解析应用版本
            val androidObj = manifest.optJSONObject(UpdaterConfig.MANIFEST_KEY_ANDROID)
            appVersion = androidObj?.optString(UpdaterConfig.MANIFEST_KEY_ANDROID_VERSION)?.takeIf { it.isNotEmpty() }

            fetched = true
            Log.d(TAG, "版本清单拉取成功: web=$webVersion, app=$appVersion")
        } catch (e: Exception) {
            Log.e(TAG, "拉取版本清单异常: ${e.message}", e)
        }
    }

    /**
     * 获取应用最新版本
     *
     * @return 最新版本号，获取失败返回 null
     */
    fun getLatestAppVersion(): String? = appVersion

    /**
     * 获取 Web 最新版本
     *
     * @return 最新版本号，获取失败返回 null
     */
    fun getLatestWebVersion(): String? = webVersion
}
