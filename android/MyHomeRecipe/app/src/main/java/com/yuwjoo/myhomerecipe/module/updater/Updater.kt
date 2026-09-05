package com.yuwjoo.myhomerecipe.module.updater

import android.content.Context
import android.util.Log
import com.yuwjoo.myhomerecipe.module.updater.internal.AppVersionManager
import com.yuwjoo.myhomerecipe.module.updater.internal.VersionManifest
import com.yuwjoo.myhomerecipe.module.updater.internal.WebVersionManager
import com.yuwjoo.myhomerecipe.module.updater.utils.VersionUtils
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * 更新器门面
 *
 * UI 层只需调用 [init] 与 [checkUpdate]，具体逻辑全部收拢在模块内部：
 * - 拉取远端版本清单，比对本地版本；
 * - 通过 [UpdateListener] 询问用户并汇报进度；
 * - App（APK）更新与 Web 资源更新互相独立，任一方失败/取消都不影响另一方。
 */
object Updater {

    private const val TAG = "Updater"

    private lateinit var appManager: AppVersionManager
    private lateinit var webManager: WebVersionManager
    private val manifest = VersionManifest()

    /** 当前已安装的 Web 资源版本 */
    val currentWebVersion: String
        get() = webManager.currentVersion

    /** 当前应用版本 */
    val currentAppVersion: String
        get() = appManager.currentVersion

    /** 本地 Web 资源是否为可用的正式版本（区别于首次安装的内置占位页） */
    val hasUsableWebResource: Boolean
        get() = webManager.isResourceReady &&
            currentWebVersion.isNotBlank() &&
            currentWebVersion != UpdaterConfig.SEED_VERSION

    /**
     * 初始化（内部会创建目录；正式环境首次启动还会植入内置占位页）
     */
    fun init(context: Context) {
        val appContext = context.applicationContext
        appManager = AppVersionManager(appContext)
        webManager = WebVersionManager(appContext)
    }

    /**
     * 执行一次完整检查：应用(APK) -> Web 资源
     *
     * @param listener 更新交互监听器
     * @return 本次是否有更新发生（下载并生效）
     */
    suspend fun checkUpdate(listener: UpdateListener? = null): Boolean {
        try {
            manifest.fetch()
        } catch (e: Exception) {
            Log.w(TAG, "拉取版本清单失败: ${e.message}")
            listener?.onUpdateError("检查更新失败：${e.message}")
            return false
        }

        var updated = false

        // 1) 应用更新（APK）
        if (VersionUtils.compareVersion(manifest.latestAppVersion, currentAppVersion) > 0) {
            updated = applyAppUpdate(manifest.latestAppVersion, listener)
        }

        // 2) Web 资源更新
        if (VersionUtils.compareVersion(manifest.latestWebVersion, currentWebVersion) > 0) {
            updated = applyWebUpdate(manifest.latestWebVersion, listener) || updated
        }

        return updated
    }

    /** 询问用户是否更新，未提供监听器时默认放行 */
    private suspend fun confirm(
        listener: UpdateListener?,
        platform: UpdatePlatform,
        version: String,
    ): Boolean {
        if (listener == null) return true

        return suspendCancellableCoroutine { cont ->
            if (cont.isActive) {
                listener.onUpdateAvailable(
                    platform = platform,
                    version = version,
                    onConfirm = { cont.resume(true) },
                    onCancel = { cont.resume(false) },
                )
            }
        }
    }

    /** 执行应用更新，返回是否成功完成 */
    private suspend fun applyAppUpdate(version: String, listener: UpdateListener?): Boolean {
        Log.i(TAG, "发现应用新版本: $version")
        if (!confirm(listener, UpdatePlatform.APP, version)) {
            Log.i(TAG, "用户取消应用更新")
            return false
        }

        return try {
            appManager.startUpdate(version) { downloaded, total ->
                listener?.onUpdateProgress(UpdatePlatform.APP, downloaded, total)
            }
            listener?.onUpdateComplete(UpdatePlatform.APP)
            true
        } catch (e: Exception) {
            Log.e(TAG, "应用更新失败: ${e.message}", e)
            listener?.onUpdateError("应用更新失败：${e.message}", UpdatePlatform.APP)
            false
        }
    }

    /** 执行 Web 资源更新，返回是否成功完成 */
    private suspend fun applyWebUpdate(version: String, listener: UpdateListener?): Boolean {
        Log.i(TAG, "发现 Web 资源新版本: $version")
        if (!confirm(listener, UpdatePlatform.WEB, version)) {
            Log.i(TAG, "用户取消 Web 更新")
            return false
        }

        return try {
            webManager.update(version) { downloaded, total ->
                listener?.onUpdateProgress(UpdatePlatform.WEB, downloaded, total)
            }
            listener?.onUpdateComplete(UpdatePlatform.WEB)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Web 更新失败: ${e.message}", e)
            listener?.onUpdateError("页面更新失败：${e.message}", UpdatePlatform.WEB)
            false
        }
    }
}
