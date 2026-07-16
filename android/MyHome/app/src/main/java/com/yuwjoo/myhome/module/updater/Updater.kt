package com.yuwjoo.myhome.module.updater

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.module.updater.internal.AppVersionManager
import com.yuwjoo.myhome.module.updater.internal.VersionManifest
import com.yuwjoo.myhome.module.updater.internal.WebVersionManager
import com.yuwjoo.myhome.module.updater.utils.VersionUtils
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * 更新器
 */
object Updater {

    private const val TAG = "Updater"

    private lateinit var context: Context // 应用上下文
    private lateinit var appManager: AppVersionManager // 应用版本管理
    private lateinit var webManager: WebVersionManager // Web 版本管理
    private val manifest = VersionManifest() // 版本清单

    val currentWebVersion: String get() = webManager.currentVersion

    val currentAppVersion: String get() = appManager.currentVersion

    /**
     * 初始化
     *
     * @param context 上下文
     */
    fun init(context: Context) {
        this.context = context.applicationContext
        this.appManager = AppVersionManager(context)
        this.webManager = WebVersionManager(context)
    }

    /**
     * 检查更新
     *
     * @param listener 更新监听器
     */
    suspend fun checkUpdate(listener: UpdateListener? = null) {
        try {
            manifest.fetch()

            // 检查应用版本
            if (VersionUtils.compareVersion(manifest.appVersion, appManager.currentVersion) > 0) {
                val latest = manifest.appVersion
                if (askUserConfirm(listener, UpdatePlatform.APP, latest)) {
                    Log.d(TAG, "用户确认，开始应用更新: $latest")
                    appManager.startUpdate(latest)
                    listener?.onUpdateComplete(UpdatePlatform.APP)
                    return
                } else {
                    Log.d(TAG, "用户跳过应用更新")
                }
            }

            // 检查 Web 版本
            if (VersionUtils.compareVersion(manifest.webVersion, webManager.currentVersion) > 0) {
                val latest = manifest.webVersion
                if (askUserConfirm(listener, UpdatePlatform.WEB, latest)) {
                    Log.d(TAG, "用户确认，开始 Web 更新: $latest")
                    webManager.startUpdate(latest)
                    listener?.onUpdateComplete(UpdatePlatform.WEB)
                } else {
                    Log.d(TAG, "用户跳过 Web 更新")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "检查更新失败: ${e.message}", e)
            listener?.onUpdateError(e.message ?: "未知错误")
        }
    }

    /**
     * 询问用户是否确认更新
     *
     * @param listener 更新监听器
     * @param platform 更新平台
     * @param version  新版本号
     * @return true 表示用户确认，false 表示取消
     */
    private suspend fun askUserConfirm(
        listener: UpdateListener?,
        platform: UpdatePlatform,
        version: String,
    ): Boolean {
        if (listener == null) return true

        return suspendCancellableCoroutine { cont ->
            listener.onUpdateAvailable(
                platform = platform,
                version = version,
                onConfirm = { cont.resume(true) },
                onCancel = { cont.resume(false) },
            )
        }
    }
}
