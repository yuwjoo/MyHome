package com.yuwjoo.myhome.ui.webview2

import android.app.Activity
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback

/**
 * WebView 返回键处理器
 */
class BackPressHandler(
    private val activity: Activity, // Activity 实例
    private val webView: WebView, // WebView 实例
) : OnBackPressedCallback(true) {

    private var lastBackTime = 0L // 上一次返回时间
    private val exitInterval = WebViewConfig.EXIT_INTERVAL_MS // 双击退出间隔

    /**
     * 处理返回键事件，优先回退网页，无历史时双击退出
     */
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
