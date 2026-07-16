package com.yuwjoo.myhome.ui.webview

import android.content.Context
import android.util.Log
import com.yuwjoo.myhome.config.AppConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File

/**
 * Web 资源管理器
 *
 * 负责管理本地 Web 资源的存储、版本检查和清理。
 * 所有文件操作在 IO 线程执行。
 */
object WebResourceManager {

    private const val TAG = "WebResourceManager"

    /**
     * 获取本地 Web 资源根目录
     *
     * @param context Android Context
     * @return 资源目录 File 对象
     */
    fun getWebRootDir(context: Context): File {
        return File(context.filesDir, AppConfig.WEB_ROOT_DIR_NAME)
    }

    /**
     * 检查本地 Web 资源是否存在
     *
     * @param context Android Context
     * @return true 如果 index.html 文件存在
     */
    suspend fun hasLocalResources(context: Context): Boolean = withContext(Dispatchers.IO) {
        val indexFile = File(getWebRootDir(context), "index.html")
        indexFile.exists() && indexFile.isFile
    }

    /**
     * 读取本地 Web 资源的版本号
     *
     * 从 web 资源目录下的 metadata.json 中读取版本信息。
     *
     * @param context Android Context
     * @return 版本号字符串，如果文件不存在或解析失败则返回 null
     */
    suspend fun getLocalVersion(context: Context): String? = withContext(Dispatchers.IO) {
        try {
            val metadataFile = File(getWebRootDir(context), AppConfig.METADATA_FILE_NAME)
            if (!metadataFile.exists()) {
                Log.w(TAG, "metadata.json 不存在")
                return@withContext null
            }

            val jsonContent = metadataFile.readText()
            val json = JSONObject(jsonContent)
            json.optString("version", "")
        } catch (e: Exception) {
            Log.e(TAG, "读取本地版本失败: ${e.message}", e)
            null
        }
    }

    /**
     * 删除本地所有 Web 资源
     *
     * @param context Android Context
     */
    suspend fun deleteLocalResources(context: Context) = withContext(Dispatchers.IO) {
        val webRoot = getWebRootDir(context)
        if (webRoot.exists()) {
            webRoot.deleteRecursively()
            Log.d(TAG, "已删除本地 Web 资源: ${webRoot.absolutePath}")
        }
    }

    /**
     * 根据请求路径，返回本地资源文件（异步版本）
     *
     * @param context Android Context
     * @param path URL 路径（例如 "/index.html" 或 "/assets/main.js"），空路径视为请求根目录
     * @return 对应的本地文件，如果文件不存在则返回 null
     */
    suspend fun getResourceFile(context: Context, path: String): File? = withContext(Dispatchers.IO) {
        getResourceFileSync(context, path)
    }

    /**
     * 根据请求路径，返回本地资源文件（同步版本）
     *
     * 用于 WebViewClient.shouldInterceptRequest 等需要在当前线程直接返回结果的场景。
     * shouldInterceptRequest 在后台线程调用，可以直接执行文件 IO。
     *
     * @param context Android Context
     * @param path URL 路径（例如 "/index.html" 或 "/assets/main.js"），空路径视为请求根目录
     * @return 对应的本地文件，如果文件不存在则返回 null
     */
    fun getResourceFileSync(context: Context, path: String): File? {
        val webRoot = getWebRootDir(context)

        // 空路径或仅 "/" 返回 index.html
        val normalizedPath = if (path.isEmpty() || path == "/") {
            "/index.html"
        } else {
            // 移除开头的 "/" 以便与 File 拼接
            path.trimStart('/').let { "/$it" }
        }

        Log.d("LocalWebResourceInterceptor", webRoot.toString())

        val file = File(webRoot, normalizedPath.removePrefix("/"))
        if (file.exists() && file.isFile) {
            return file
        }

        // 对于 SPA 路由（非文件请求），也返回 index.html
        val indexFile = File(webRoot, "index.html")
        return if (indexFile.exists()) indexFile else null
    }
}
