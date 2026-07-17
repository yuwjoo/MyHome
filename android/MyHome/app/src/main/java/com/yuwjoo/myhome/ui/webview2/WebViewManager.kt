package com.yuwjoo.myhome.ui.webview2

import android.annotation.SuppressLint
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.ComponentActivity
import com.yuwjoo.myhome.config.AppConfig
import com.yuwjoo.myhome.module.bridge.Bridge

/**
 * WebView 管理器
 */
class WebViewManager(
    private val activity: ComponentActivity,
) {
    val webView: WebView = createWebView() // WebView 实例

    init {
        // 注册返回键回调
        activity.onBackPressedDispatcher.addCallback(activity, BackPressHandler(activity, webView))
    }

    /**
     * 创建并配置 WebView
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
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
     */
    fun loadWeb() {
        val url = if (AppConfig.isRelease) WebViewConfig.RELEASE_WEB_URL else WebViewConfig.DEV_WEB_URL
        webView.loadUrl(url)
    }
}
