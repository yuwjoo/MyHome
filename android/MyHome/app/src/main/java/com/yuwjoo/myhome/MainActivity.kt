package com.yuwjoo.myhome

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var statusBarHeightPx = 0
    private var lastBackTime = 0L
    private val exitInterval = 2000L // 2秒内再次返回则退出

    /**
     * 注入状态栏高度的 JS 脚本 —— 前端不会做 dpr 换算，直接使用 CSS 像素
     */
    private fun buildInjectScript(): String {
        val dpr = resources.displayMetrics.density
        val cssHeight = Math.round(statusBarHeightPx / dpr)
        return """
            (function() {
                window.__NATIVE__ = {
                    statusBarHeight: $cssHeight,
                    isAndroid: true
                };
                document.documentElement.style.setProperty('--status-bar-height', '${cssHeight}px');
                document.dispatchEvent(new CustomEvent('nativeBridgeReady'));
            })();
        """.trimIndent()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        webView = WebView(this).apply {
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    view?.evaluateJavascript(buildInjectScript(), null)
                }
            }
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            loadUrl("http://47.115.161.79:5173/")
        }

        setContentView(webView)

        // 沉浸式：WebView 扩展到状态栏下方，前端用 paddingTop 避让
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            statusBarHeightPx = systemBars.top
            // 顶部由前端处理，原生只处理左右和底部
            view.setPadding(systemBars.left, 0, systemBars.right, systemBars.bottom)

            // insets 变化后实时同步到前端（例如横竖屏切换）
            webView.evaluateJavascript(buildInjectScript(), null)
            insets
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    val now = System.currentTimeMillis()
                    if (now - lastBackTime < exitInterval) {
                        finish()
                    } else {
                        lastBackTime = now
                        Toast.makeText(this@MainActivity, "再按一次退出应用", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        })
    }
}
