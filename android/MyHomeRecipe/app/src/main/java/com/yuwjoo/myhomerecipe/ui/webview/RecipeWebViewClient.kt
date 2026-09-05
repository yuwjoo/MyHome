package com.yuwjoo.myhomerecipe.ui.webview

import android.content.Context
import android.util.Log
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import com.yuwjoo.myhomerecipe.config.AppConfig
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream

/**
 * WebView 客户端
 *
 * 正式环境下把本地虚拟域名的所有请求（主页面与静态资源）拦截到 filesDir 中的本地文件，
 * 并支持 SPA 路由回退到 index.html。
 */
class RecipeWebViewClient(
    context: Context,
    /** 页面主文档加载完成回调（供壳层回放系统栏 inset 注入） */
    var onPageFinished: (() -> Unit)? = null,
) : WebViewClient() {

    companion object {
        private const val TAG = "RecipeWebViewClient"
        private const val INDEX_FILE_NAME = "index.html"
    }

    private val resourceDir = File(context.filesDir, AppConfig.WEB_ROOT_DIR_NAME)
    private val indexFile = File(resourceDir, INDEX_FILE_NAME)

    private val assetLoader = WebViewAssetLoader.Builder()
        .setDomain(AppConfig.LOCAL_RESOURCE_HOST)
        .setHttpAllowed(true)
        .addPathHandler("/", object : WebViewAssetLoader.PathHandler {
            private val delegate = WebViewAssetLoader.InternalStoragePathHandler(context, resourceDir)

            override fun handle(path: String): WebResourceResponse {
                // 根路径统一映射到 SPA 入口
                val resolvedPath = if (path.isEmpty() || path == "/") "/$INDEX_FILE_NAME" else path
                return delegate.handle(resolvedPath)
            }
        })
        .build()

    /**
     * 主文档加载完成：通知壳层回放安全区 inset（页面在后续路由切换中不会重新
     * 加载文档，因此只需在此时注入一次；inset 变化时由监听器单独注入）。
     */
    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        onPageFinished?.invoke()
    }

    /**
     * 拦截资源请求
     *
     * - 开发环境：直接请求开发服务器，不拦截
     * - 正式环境：本地虚拟域名内的请求映射到本地文件；
     *   目标文件存在时交给 assetLoader 处理（负责 MIME 推断）；
     *   文件缺失时仅对主框架请求回退 index.html（SPA 路由），
     *   子资源缺失（如 Chromium 自动请求的 /favicon.ico）直接返回 null 放行。
     *
     * 必须先在外部判断文件是否存在：WebViewAssetLoader 对缺失文件会在内部
     * 打一整条 E 日志再抛 FileNotFoundException（我们虽能 catch，但日志已刷屏）。
     */
    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest,
    ): WebResourceResponse? {
        if (AppConfig.IS_DEV) return super.shouldInterceptRequest(view, request)

        if (request.url.host != AppConfig.LOCAL_RESOURCE_HOST) {
            return super.shouldInterceptRequest(view, request)
        }

        val file = resolveFile(request)
        if (file?.isFile != true) {
            // 文件不存在：主框架走 SPA 兜底，子资源直接放行（不触发 loader 内部异常）
            return if (request.isForMainFrame) {
                fallbackResponse(onlyForMainFrame = true)
            } else {
                null
            }
        }

        return try {
            assetLoader.shouldInterceptRequest(request.url)
                ?: fallbackResponse(onlyForMainFrame = request.isForMainFrame)
        } catch (e: Exception) {
            Log.w(TAG, "本地资源拦截失败: ${request.url}", e)
            fallbackResponse(onlyForMainFrame = request.isForMainFrame)
        }
    }

    /**
     * 把请求 URL 解析为本地资源目录下的目标文件（与根路径处理器的映射规则一致）：
     * - 根路径 "/"（或空）→ index.html；
     * - 其余路径去掉前导 "/" 后与 resourceDir 拼接；
     * - 含 ".." 段落的路径一律视为不存在（防目录穿越）。
     */
    private fun resolveFile(request: WebResourceRequest): File? {
        val relative = request.url.path?.trimStart('/') ?: return null
        if (relative.isEmpty()) return indexFile
        if (relative.split('/').any { it == ".." }) return null
        return File(resourceDir, relative)
    }

    /**
     * SPA 兜底响应：文件缺失时返回 index.html（仅主框架导航），
     * 极端情况下连 index 都不存在时返回一段占位 HTML 避免抛异常。
     */
    private fun fallbackResponse(onlyForMainFrame: Boolean): WebResourceResponse? {
        if (!onlyForMainFrame) return null

        return try {
            WebResourceResponse("text/html", "UTF-8", FileInputStream(indexFile))
        } catch (_: Exception) {
            Log.e(TAG, "index.html 不存在: ${indexFile.absolutePath}")
            WebResourceResponse(
                "text/html",
                "UTF-8",
                ByteArrayInputStream("资源尚未就绪".toByteArray()),
            )
        }
    }
}
