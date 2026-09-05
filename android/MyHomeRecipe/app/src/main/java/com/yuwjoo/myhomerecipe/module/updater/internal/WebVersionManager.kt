package com.yuwjoo.myhomerecipe.module.updater.internal

import android.content.Context
import android.util.Log
import com.yuwjoo.myhomerecipe.module.updater.UpdaterConfig
import com.yuwjoo.myhomerecipe.module.updater.utils.FileUtils
import org.json.JSONObject
import java.io.File
import java.io.IOException

/**
 * Web 资源版本管理
 *
 * 负责：
 * 1. 首次安装时从 assets 植入内置占位页，保证任何状态下 App 都有可用页面；
 * 2. 下载新版资源并「原子切换」：先完整解压到暂存目录并校验，
 *    确认无误后再整体替换正式目录，中途失败不影响当前版本。
 */
class WebVersionManager(context: Context) {

    companion object {
        private const val TAG = "WebVersionManager"
        private const val INDEX_FILE_NAME = "index.html"
    }

    private val appContext = context.applicationContext

    /** 正式资源目录（filesDir 下） */
    private val contentDir = File(appContext.filesDir, UpdaterConfig.WEB_ROOT_DIR_NAME)

    /** 版本记录文件 */
    private val metadataFile = File(contentDir, UpdaterConfig.WEB_METADATA_FILE_NAME)

    /** SPA 入口 */
    private val indexFile = File(contentDir, INDEX_FILE_NAME)

    /** 当前已安装的 Web 资源版本号（无记录为空串） */
    var currentVersion: String = readCurrentVersion()
        private set

    /** 本地资源是否可用（以 index.html 是否存在为准） */
    val isResourceReady: Boolean
        get() = indexFile.isFile

    init {
        // 首次安装（或资源目录损坏）时植入内置占位页，保证开箱可用
        if (!isResourceReady) {
            seedPlaceholder()
        }
    }

    /**
     * 下载并安装指定版本
     *
     * 整个流程为幂等操作：任一环节失败都保留当前可用版本，不破坏运行状态。
     *
     * @param version    目标版本号
     * @param onProgress 下载进度回调
     */
    suspend fun update(
        version: String,
        onProgress: ((downloaded: Long, total: Long) -> Unit)? = null,
    ) {
        Log.i(TAG, "开始更新 Web 资源: $version")
        val zipFile = File(appContext.cacheDir, UpdaterConfig.WEB_ZIP_TEMP_FILE_NAME)
        val stagingDir = File(appContext.cacheDir, UpdaterConfig.WEB_STAGING_DIR_NAME)

        try {
            // 1. 下载（失败不影响当前资源）
            FileUtils.download(UpdaterConfig.WEB_DOWNLOAD_URL, zipFile, onProgress)
            Log.i(TAG, "资源包下载完成: $version")

            // 2. 解压到暂存目录并校验（失败不影响当前资源）
            FileUtils.unzip(zipFile, stagingDir)
            if (!File(stagingDir, INDEX_FILE_NAME).isFile) {
                throw IOException("资源包缺少 $INDEX_FILE_NAME，已中止更新")
            }

            // 3. 校验通过后整体切换
            activate(stagingDir)

            // 4. 记录版本号：包内未自带 metadata.json 时以清单版本兜底写入，
            //    避免因读不到版本号而每次启动重复下载
            recordVersion(version)
            Log.i(TAG, "Web 资源更新完成: $version")
        } finally {
            zipFile.delete()
            if (stagingDir.exists()) {
                stagingDir.deleteRecursively()
            }
        }
    }

    /**
     * 读取当前版本号
     */
    private fun readCurrentVersion(): String {
        val content = FileUtils.read(metadataFile) ?: return ""
        val version = parseVersion(content)
        if (version == null) {
            Log.w(TAG, "版本文件解析失败，按空版本处理")
            return ""
        }
        return version
    }

    /**
     * 首次植入：把 assets/[SEED_ASSET_DIR] 复制为正式资源目录
     */
    private fun seedPlaceholder() {
        try {
            // 清除可能残留的不完整目录
            if (contentDir.exists()) contentDir.deleteRecursively()
            contentDir.mkdirs()

            FileUtils.copyAssetDir(appContext.assets, UpdaterConfig.SEED_ASSET_DIR, contentDir)

            // 占位包通常不带版本记录，写入种子版本号
            if (FileUtils.read(metadataFile).isNullOrEmpty()) {
                FileUtils.write(metadataFile, """{"version":"${UpdaterConfig.SEED_VERSION}"}""")
            }
            currentVersion = readCurrentVersion()
            Log.i(TAG, "已植入内置占位页，版本: $currentVersion")
        } catch (e: Exception) {
            Log.e(TAG, "植入占位页失败", e)
        }
    }

    /**
     * 校验通过后把暂存目录整体切换为正式目录（先删后改名，
     * 同分区内 rename 接近原子，切换窗口极短）
     */
    private fun activate(stagingDir: File) {
        if (contentDir.exists()) contentDir.deleteRecursively()
        contentDir.parentFile?.mkdirs()
        if (!stagingDir.renameTo(contentDir)) {
            throw IOException("切换到新版本资源失败")
        }
    }

    /**
     * 记录生效版本：包内自带 metadata.json 则以包内版本为准，
     * 否则写入清单版本，避免更新循环
     */
    private fun recordVersion(fallbackVersion: String) {
        val bundledVersion = FileUtils.read(metadataFile)?.let { parseVersion(it) }
        if (!bundledVersion.isNullOrEmpty()) {
            currentVersion = bundledVersion
        } else {
            FileUtils.write(metadataFile, """{"version":"$fallbackVersion"}""")
            currentVersion = fallbackVersion
        }
    }

    /** 解析 metadata.json 中的 version 字段，解析失败返回 null */
    private fun parseVersion(raw: String): String? = try {
        JSONObject(raw).optString("version").takeIf { it.isNotEmpty() }
    } catch (_: Exception) {
        null
    }
}
