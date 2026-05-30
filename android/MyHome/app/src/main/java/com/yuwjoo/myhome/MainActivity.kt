package com.yuwjoo.myhome

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.yuwjoo.myhome.webview.WebViewManager

/**
 * 主 Activity
 *
 * 应用唯一入口，负责：
 * - 启用边到边 (edge-to-edge) 全屏布局
 * - 创建 WebViewManager 托管 WebView 及资源初始化
 * - 注册返回键回调
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webViewManager: WebViewManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 启用 WebView 远程调试（仅开发阶段）
        WebView.setWebContentsDebuggingEnabled(true)

        // 创建 WebView 管理器（内部完成 WebView 创建、配置、拦截器绑定）
        webViewManager = WebViewManager(this, lifecycleScope)

        // 将 WebView 设为内容视图
        setContentView(webViewManager.webView)

        // 沉浸式：WebView 扩展到状态栏 / 导航栏下方
        setupEdgeToEdgeInsets(webViewManager.webView)

        // 注册返回键回调（WebView 回退 + 双击退出）
        onBackPressedDispatcher.addCallback(this, webViewManager.backPressCallback)

        // 启动 Web 资源初始化（检查/下载/更新 → 就绪后加载页面）
        webViewManager.initializeResources()
    }

    /** 让 WebView 在系统栏后绘制，同时保留安全区域 padding */
    private fun setupEdgeToEdgeInsets(webView: WebView) {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, 0, systemBars.right, systemBars.bottom)
            insets
        }
    }
}
