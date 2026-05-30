package com.yuwjoo.myhome.webview

import android.annotation.SuppressLint
import android.app.Activity
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.lifecycle.LifecycleCoroutineScope
import com.yuwjoo.myhome.config.AppConfig
import com.yuwjoo.myhome.update.WebResourceInitializer

/**
 * WebView 管理器
 *
 * 封装 WebView 的创建、配置、返回键处理及资源初始化等全部逻辑，
 * MainActivity 仅需持有此实例并做容器层布局。
 */
class WebViewManager(
    private val activity: Activity,
    private val lifecycleScope: LifecycleCoroutineScope,
) {
    /** 对外暴露的 WebView 实例，供 Activity 设置布局和 insets */
    val webView: WebView

    /** 返回键回调，供 Activity 注册到 OnBackPressedDispatcher */
    val backPressCallback: OnBackPressedCallback

    /** 双击退出间隔（毫秒） */
    private var lastBackTime = 0L
    private val exitInterval = 2000L

    init {
        webView = createWebView()
        backPressCallback = createBackPressCallback()
    }

    // ──────────────────────────────────────────────
    // WebView 创建与配置
    // ──────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        return WebView(activity).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                allowFileAccess = true
                allowContentAccess = true
            }

            // 拦截 http://local-web 请求，映射到本地文件
            webViewClient = LocalWebResourceInterceptor(activity)
        }
    }

    // ──────────────────────────────────────────────
    // 返回键处理
    // ──────────────────────────────────────────────

    private fun createBackPressCallback(): OnBackPressedCallback {
        return object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    val now = System.currentTimeMillis()
                    if (now - lastBackTime < exitInterval) {
                        activity.finish()
                    } else {
                        lastBackTime = now
                        Toast.makeText(activity, "再按一次退出应用", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    // 资源初始化
    // ──────────────────────────────────────────────

    /**
     * 启动 Web 资源初始化流程。
     *
     * 在 Activity.onCreate 中调用，绑定到 Activity 的生命周期作用域，
     * 确保 Activity 销毁时自动取消协程。
     */
    fun initializeResources() {
        WebResourceInitializer.initialize(
            activity = activity,
            scope = lifecycleScope,
            callback = object : WebResourceInitializer.Callback {
                override fun onResourcesReady() {
                    webView.loadUrl(AppConfig.LOCAL_WEB_HOST)
                }

                override fun onError(message: String) {
                    Toast.makeText(activity, "资源初始化失败: $message", Toast.LENGTH_LONG).show()
                    // 延迟退出，确保 Toast 可见
                    webView.postDelayed({ activity.finish() }, 2000)
                }
            },
        )
    }
}
