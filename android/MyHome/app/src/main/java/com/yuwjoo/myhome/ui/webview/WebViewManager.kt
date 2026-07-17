package com.yuwjoo.myhome.ui.webview

import android.annotation.SuppressLint
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.ComponentActivity
import com.yuwjoo.myhome.config.AppConfig
import com.yuwjoo.myhome.module.bridge.Bridge
import com.yuwjoo.myhome.module.updater.Updater

/**
 * WebView 管理器
 */
class WebViewManager(
    private val activity: ComponentActivity, // Activity 实例
) {
    val webView: WebView = createWebView() // WebView 实例
    private var loadedVersion: String = "" // 已加载的 web 资源版本号

    init {
        // 注册返回键回调
        activity.onBackPressedDispatcher.addCallback(activity, BackPressHandler(activity, webView))
    }

    /**
     * 创建并配置 WebView
     *
     * @return 配置完成的 WebView 实例
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        // 开发环境启用 WebView 调试
        if (AppConfig.IS_DEV) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        return WebView(activity).apply {
            settings.apply {
                javaScriptEnabled = true // 启用 JavaScript
                domStorageEnabled = true // 启用 DOM Storage
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW // 允许混合内容
                cacheMode = WebSettings.LOAD_DEFAULT // 默认缓存策略
                allowFileAccess = true // 允许访问本地文件
                allowContentAccess = true // 允许 Content Provider 访问
            }

            webChromeClient = MyWebChromeClient(activity)
            webViewClient = MyWebViewClient(activity)

            Bridge.mount(this)
        }
    }

    /**
     * 加载 Web 页面
     *
     * @param forceRefresh 是否强制刷新，默认 false
     */
    fun loadWeb(forceRefresh: Boolean = false) {
        val localWebVersion = Updater.currentWebVersion

        // 正式环境下，需要判断本地是否已经存在web资源文件
        if (AppConfig.IS_RELEASE && localWebVersion.isEmpty()) return

        if (!forceRefresh && localWebVersion == loadedVersion) return

        val url = if (AppConfig.IS_RELEASE) WebViewConfig.RELEASE_WEB_URL else WebViewConfig.DEV_WEB_URL
        webView.loadUrl(url)

        loadedVersion = localWebVersion
    }
}
