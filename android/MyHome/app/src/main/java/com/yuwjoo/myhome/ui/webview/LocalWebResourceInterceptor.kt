package com.yuwjoo.myhome.ui.webview

import android.content.Context
import android.util.Log
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import java.io.FileInputStream
import java.net.URI

/**
 * 本地 Web 资源请求拦截器
 *
 * 拦截 WebView 中所有指向 http://local-web 的请求，
 * 将请求映射到本地存储的 Web 资源文件并返回对应内容。
 *
 * 通过 shouldInterceptRequest 钩子实现请求拦截，
 * 无需启动本地 HTTP 服务器，性能更高、更简洁。
 */
class LocalWebResourceInterceptor(
    private val context: Context
) : WebViewClient() {

    private val TAG = "LocalWebResourceInterceptor"

    /** 协程作用域，用于异步获取资源 */
    private val scope = CoroutineScope(Dispatchers.IO)

    /**
     * 拦截 WebView 请求，将 http://local-web 的请求映射到本地文件
     */
    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        if (request == null) return null

        val url = request.url.toString()
        val host = request.url.host

        // 仅拦截 local-web 域名的请求
        if (host != "local-web") {
            return null
        }

        Log.d(TAG, "拦截请求: $url")

        // 提取路径部分
        val path = URI(url).rawPath

        // 同步获取资源文件（shouldInterceptRequest 在后台线程调用，可以执行 IO 操作）
        return try {
            val resourceFile = WebResourceManager.getResourceFileSync(context, path)
            if (resourceFile != null && resourceFile.exists()) {
                val mimeType = getMimeType(resourceFile.name)
                Log.d(TAG, "提供本地文件: ${resourceFile.absolutePath}, MIME: $mimeType，path: $path")
                WebResourceResponse(
                    mimeType,
                    "UTF-8",
                    FileInputStream(resourceFile)
                )
            } else {
                Log.w(TAG, "本地文件不存在: $path")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "读取本地文件失败: ${e.message}", e)
            null
        }
    }

    /**
     * 根据文件名获取 MIME 类型
     */
    private fun getMimeType(fileName: String): String {
        return when {
            fileName.endsWith(".html") || fileName.endsWith(".htm") -> "text/html"
            fileName.endsWith(".css") -> "text/css"
            fileName.endsWith(".js") -> "text/javascript"
            fileName.endsWith(".json") -> "application/json"
            fileName.endsWith(".png") -> "image/png"
            fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") -> "image/jpeg"
            fileName.endsWith(".gif") -> "image/gif"
            fileName.endsWith(".svg") -> "image/svg+xml"
            fileName.endsWith(".webp") -> "image/webp"
            fileName.endsWith(".ico") -> "image/x-icon"
            fileName.endsWith(".woff") -> "font/woff"
            fileName.endsWith(".woff2") -> "font/woff2"
            fileName.endsWith(".ttf") -> "font/ttf"
            fileName.endsWith(".eot") -> "application/vnd.ms-fontobject"
            fileName.endsWith(".mp4") -> "video/mp4"
            fileName.endsWith(".webm") -> "video/webm"
            fileName.endsWith(".mp3") -> "audio/mpeg"
            fileName.endsWith(".wav") -> "audio/wav"
            fileName.endsWith(".xml") -> "application/xml"
            fileName.endsWith(".txt") -> "text/plain"
            fileName.endsWith(".pdf") -> "application/pdf"
            else -> "application/octet-stream"
        }
    }
}
