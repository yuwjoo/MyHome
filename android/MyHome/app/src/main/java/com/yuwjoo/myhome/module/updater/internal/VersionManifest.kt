package com.yuwjoo.myhome.module.updater.internal

import android.util.Log
import com.yuwjoo.myhome.module.updater.UpdaterConfig
import com.yuwjoo.myhome.module.updater.utils.FileUtils
import org.json.JSONObject

/**
 * 版本清单
 */
class VersionManifest {

    companion object {
        private const val TAG = "VersionManifest"
    }

    var webVersion: String = "" // 缓存的 web 版本
        private set
    var appVersion: String = "" // 缓存的应用版本
        private set

    /**
     * 拉取版本清单
     */
    suspend fun fetch() {
        Log.d(TAG, "拉取版本清单: ${UpdaterConfig.VERSION_MANIFEST_URL}")

        val body = FileUtils.fetch(UpdaterConfig.VERSION_MANIFEST_URL) ?: run {
            Log.e(TAG, "拉取版本清单失败")
            webVersion = ""
            appVersion = ""
            return
        }

        try {
            val manifest = JSONObject(body)

            // 解析 web 版本
            val webObj = manifest.optJSONObject("web")
            webVersion = webObj?.optString("my-home-mobile")?.takeIf { it.isNotEmpty() } ?: ""

            // 解析应用版本
            val androidObj = manifest.optJSONObject("android")
            appVersion = androidObj?.optString("MyHome")?.takeIf { it.isNotEmpty() } ?: ""

            Log.d(TAG, "版本清单拉取成功: web=$webVersion, app=$appVersion")
        } catch (e: Exception) {
            Log.e(TAG, "解析版本清单异常: ${e.message}", e)
        }
    }
}
