package com.yuwjoo.myhome.ui.webview2

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import com.yuwjoo.myhome.config.AppConfig
import java.io.File
import java.io.FileInputStream

/**
 * WebView 客户端
 *
 * 正式环境下拦截 [WebViewConfig.LOCAL_RESOURCE_HOST] 域名的请求，
 * 映射到本地文件系统，实现离线资源加载。
 */
class MyWebViewClient(
    private val activity: ComponentActivity,
) : WebViewClient() {

    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest,
    ): WebResourceResponse? {
        val host = request.url.host

        // 开发环境 或者 非本地资源域名 的请求，不特殊处理
        if (AppConfig.isDebug || host != WebViewConfig.LOCAL_RESOURCE_HOST) {
            return super.shouldInterceptRequest(view, request)
        }

        // 将虚拟域名请求映射到本地文件
        val path = request.url.path ?: "/"
        val fileName = if (path == "/" || path.isEmpty()) "index.html" else path.removePrefix("/")
        val file = File(activity.filesDir, "${WebViewConfig.LOCAL_RESOURCE_HOST}/$fileName")

        return if (file.exists()) {
            WebResourceResponse(getMimeType(fileName), "UTF-8", FileInputStream(file))
        } else {
            super.shouldInterceptRequest(view, request)
        }
    }

    /**
     * 根据文件扩展名获取 MIME 类型
     */
    private fun getMimeType(fileName: String): String {
        return when {
            fileName.endsWith(".html") || fileName.endsWith(".htm") -> "text/html"
            fileName.endsWith(".js") -> "application/javascript"
            fileName.endsWith(".css") -> "text/css"
            fileName.endsWith(".json") -> "application/json"
            fileName.endsWith(".png") -> "image/png"
            fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") -> "image/jpeg"
            fileName.endsWith(".gif") -> "image/gif"
            fileName.endsWith(".svg") -> "image/svg+xml"
            fileName.endsWith(".woff") -> "font/woff"
            fileName.endsWith(".woff2") -> "font/woff2"
            fileName.endsWith(".ttf") -> "font/ttf"
            fileName.endsWith(".ico") -> "image/x-icon"
            else -> "application/octet-stream"
        }
    }
}
