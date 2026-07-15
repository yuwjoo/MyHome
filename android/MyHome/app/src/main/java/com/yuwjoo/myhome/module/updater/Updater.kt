package com.yuwjoo.myhome.module.updater

import android.content.Context
import android.util.Log
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * 更新器
 */
class Updater(private val context: Context) {

    companion object {
        private const val TAG = "Updater"
    }

    private val manifest = VersionManifest() // 版本清单
    private val appManager = AppVersionManager(context) // 应用版本管理
    private val webManager = WebVersionManager(context) // Web 版本管理

    // ==================== 检查更新 ====================

    /**
     * 检查更新
     *
     * @param listener 更新监听器
     */
    suspend fun checkUpdate(listener: UpdateListener? = null) {
        // 拉取版本清单
        manifest.fetch()

        // 检查应用版本
        if (hasNewAppVersion()) {
            val latest = getLatestAppVersion() ?: return

            val confirmed = askUserConfirm(listener, latest)

            if (confirmed) {
                Log.d(TAG, "用户确认，开始应用更新: $latest")
                appManager.downloadUpdate(latest)
                return
            }
            Log.d(TAG, "用户跳过应用更新")
        }

        // 检查并自动更新 Web
        if (hasNewWebVersion()) {
            val latest = getLatestWebVersion() ?: return
            Log.d(TAG, "Web 有新版本，开始自动更新")
            webManager.downloadUpdate(latest)
            listener?.onWebUpdateComplete()
        }
    }

    /**
     * 询问用户是否确认更新
     *
     * @param listener 更新监听器
     * @param version  最新版本号
     * @return true 表示用户确认
     */
    private suspend fun askUserConfirm(
        listener: UpdateListener?,
        version: String,
    ): Boolean {
        if (listener == null) return false

        return suspendCancellableCoroutine { cont ->
            listener.onAppUpdateAvailable(
                version = version,
                onConfirm = { cont.resume(true) },
                onSkip = { cont.resume(false) },
            )
            cont.invokeOnCancellation { /* 取消时不做特殊处理 */ }
        }
    }

    // ==================== Web 版本 ====================

    /**
     * 获取 Web 最新版本
     *
     * @return 最新版本号，获取失败返回 null
     */
    fun getLatestWebVersion(): String? = manifest.getLatestWebVersion()

    /**
     * 获取 Web 当前版本
     *
     * @return 当前已安装的版本号
     */
    fun getCurrentWebVersion(): String = webManager.currentVersion

    /**
     * Web 是否存在新版本
     *
     * @return true 表示有新版本可用
     */
    suspend fun hasNewWebVersion(): Boolean {
        val latest = getLatestWebVersion() ?: return false
        val current = getCurrentWebVersion()
        return current.isEmpty() || VersionUtils.compareVersion(latest, current) > 0
    }

    // ==================== 应用版本 ====================

    /**
     * 获取应用最新版本
     *
     * @return 最新版本号，获取失败返回 null
     */
    fun getLatestAppVersion(): String? = manifest.getLatestAppVersion()

    /**
     * 获取应用当前版本
     *
     * @return 当前应用版本号
     */
    fun getCurrentAppVersion(): String = AppVersionManager.getAppVersion()

    /**
     * 应用是否存在新版本
     *
     * @return true 表示有新版本可用
     */
    suspend fun hasNewAppVersion(): Boolean {
        val latest = getLatestAppVersion() ?: return false
        val current = getCurrentAppVersion()
        return VersionUtils.compareVersion(latest, current) > 0
    }
}
