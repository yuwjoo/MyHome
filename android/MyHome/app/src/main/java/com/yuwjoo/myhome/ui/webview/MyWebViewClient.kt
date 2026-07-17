package com.yuwjoo.myhome.ui.webview

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.webkit.WebViewAssetLoader
import com.yuwjoo.myhome.config.AppConfig
import java.io.File
import java.io.FileInputStream

/**
 * WebView 客户端
 */
class MyWebViewClient(
    private val activity: ComponentActivity, // Activity 实例
) : WebViewClient() {

    private val resourceDir = File(activity.filesDir, WebViewConfig.LOCAL_RESOURCE_HOST) // 本地资源目录
    private val indexFile = File(resourceDir, "index.html") // SPA 入口文件

    private val assetLoader = WebViewAssetLoader.Builder()
        .setDomain(WebViewConfig.LOCAL_RESOURCE_HOST)
        .setHttpAllowed(true)
        .addPathHandler("/", object : WebViewAssetLoader.PathHandler {
            private val delegate = WebViewAssetLoader.InternalStoragePathHandler(activity, resourceDir)

            override fun handle(path: String): WebResourceResponse {
                val resolvedPath = if (path.isEmpty() || path == "/") "/index.html" else path
                return delegate.handle(resolvedPath)
            }
        })
        .build()

    /**
     * 拦截资源请求，生产环境将虚拟域名映射到本地文件
     *
     * @param view    WebView 实例
     * @param request 资源请求
     * @return 本地文件响应，非本地资源返回 super
     */
    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest,
    ): WebResourceResponse? {
        // 开发环境不拦截
        if (AppConfig.IS_DEV) return super.shouldInterceptRequest(view, request)

        // 非本地资源域名不拦截
        if (request.url.host != WebViewConfig.LOCAL_RESOURCE_HOST) {
            return super.shouldInterceptRequest(view, request)
        }

        // AssetLoader 处理匹配域名的资源请求
        val response = assetLoader.shouldInterceptRequest(request.url)
        if (response != null) return response

        // 文件不存在时 fallback 到 index.html（SPA 路由）
        return WebResourceResponse("text/html", "UTF-8", FileInputStream(indexFile))
    }
}
