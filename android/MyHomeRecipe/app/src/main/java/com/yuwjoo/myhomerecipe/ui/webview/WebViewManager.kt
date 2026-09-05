package com.yuwjoo.myhomerecipe.ui.webview

import android.annotation.SuppressLint
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.ComponentActivity
import com.yuwjoo.myhomerecipe.config.AppConfig
import com.yuwjoo.myhomerecipe.module.updater.Updater

/**
 * WebView 管理器
 *
 * 负责创建、配置 WebView，并决定加载地址：
 * - 开发环境：加载远程开发服务器（便于热更新调试）
 * - 正式环境：加载本地虚拟域名，由 [RecipeWebViewClient] 拦截映射到本地文件
 */
class WebViewManager(
    private val activity: ComponentActivity,
) {

    /** WebViewClient：保留引用，用于注册「主文档加载完成」回调 */
    private val recipeWebViewClient = RecipeWebViewClient(activity.applicationContext)

    /** WebView 实例 */
    val webView: WebView = createWebView()

    /** 当前已加载资源的版本号（正式环境用于避免重复加载） */
    private var loadedVersion: String = ""

    init {
        // 注册返回键回调：优先网页回退，无历史时双击退出
        activity.onBackPressedDispatcher.addCallback(activity, BackPressHandler(activity, webView))
    }

    /**
     * 创建并配置 WebView
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        // 开发环境启用 WebView 调试（可在 chrome://inspect 中调试页面）
        if (AppConfig.IS_DEV) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        return WebView(activity).apply {
            settings.apply {
                javaScriptEnabled = true // SPA 依赖 JS 渲染
                domStorageEnabled = true // SPA 路由与本地存储依赖 DOM Storage
                // 私人应用内嵌页面可能混用 http 资源（如家庭服务器图片），放开混合内容限制
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                allowContentAccess = true // 允许 WebView 展示 content://（如相册选择结果）
            }

            webViewClient = recipeWebViewClient
            webChromeClient = RecipeWebChromeClient(activity)
        }
    }

    /**
     * 注册「主文档加载完成」回调
     *
     * SPA 页面在路由切换时不会重新加载文档，因此系统栏 inset 只需在每次
     * 文档加载完成后回放一次即可（inset 变化时由监听器单独注入）。
     */
    fun onPageLoaded(listener: () -> Unit) {
        recipeWebViewClient.onPageFinished = listener
    }

    /**
     * 加载 Web 页面
     *
     * @param forceRefresh 是否强制刷新（更新完成后需要覆盖版本判断强制加载）
     */
    fun loadWeb(forceRefresh: Boolean = false) {
        if (AppConfig.IS_RELEASE) {
            val currentVersion = Updater.currentWebVersion
            // 版本未变化时跳过，避免每次从后台返回都重复加载
            if (!forceRefresh && currentVersion == loadedVersion) return
            loadedVersion = currentVersion
        }

        webView.loadUrl(pageUrl())
    }

    /**
     * 根据环境计算页面地址
     */
    private fun pageUrl(): String =
        if (AppConfig.IS_RELEASE) {
            "${AppConfig.LOCAL_RESOURCE_PROTOCOL}://${AppConfig.LOCAL_RESOURCE_HOST}"
        } else {
            AppConfig.DEV_WEB_URL
        }
}
