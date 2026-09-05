package com.yuwjoo.myhomerecipe.module.updater.internal

import android.util.Log
import com.yuwjoo.myhomerecipe.module.updater.UpdaterConfig
import com.yuwjoo.myhomerecipe.module.updater.utils.FileUtils
import org.json.JSONObject

/**
 * 远端版本清单
 *
 * 拉取 versionManifest.json 并解析出本产品（web / android）的最新版本号。
 * key 结构在 UpdaterConfig 中集中声明，修改远端 key 无需改动此处逻辑。
 */
class VersionManifest {

    companion object {
        private const val TAG = "VersionManifest"
    }

    /** 最新 Web 资源版本 */
    var latestWebVersion: String = ""
        private set

    /** 最新应用版本 */
    var latestAppVersion: String = ""
        private set

    /**
     * 拉取并解析版本清单
     *
     * @throws Exception 网络错误、响应非 2xx 或 JSON 解析失败
     */
    suspend fun fetch() {
        Log.i(TAG, "拉取版本清单: ${UpdaterConfig.VERSION_MANIFEST_URL}")

        val body = FileUtils.fetch(UpdaterConfig.VERSION_MANIFEST_URL)
        val manifest = JSONObject(body)

        latestWebVersion = parseVersion(
            manifest.optJSONObject(UpdaterConfig.MANIFEST_SECTION_WEB),
            UpdaterConfig.MANIFEST_KEY_WEB,
        )
        latestAppVersion = parseVersion(
            manifest.optJSONObject(UpdaterConfig.MANIFEST_SECTION_ANDROID),
            UpdaterConfig.MANIFEST_KEY_ANDROID,
        )

        Log.i(TAG, "版本清单拉取成功: web=$latestWebVersion, app=$latestAppVersion")
    }

    /** 从 section 对象中读取指定 key 的版本号 */
    private fun parseVersion(section: JSONObject?, key: String): String {
        if (section == null) return ""
        return section.optString(key).takeIf { it.isNotEmpty() } ?: ""
    }
}
