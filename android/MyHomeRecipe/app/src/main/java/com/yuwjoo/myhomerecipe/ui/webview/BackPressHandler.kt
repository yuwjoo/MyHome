package com.yuwjoo.myhomerecipe.ui.webview

import android.app.Activity
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import com.yuwjoo.myhomerecipe.config.AppConfig

/**
 * WebView 返回键处理器
 *
 * 返回键优先级：
 * 1. 网页存在历史记录 -> 网页回退
 * 2. 连续按两次 -> 退出应用
 */
class BackPressHandler(
    private val activity: Activity,
    private val webView: WebView,
) : OnBackPressedCallback(true) {

    private var lastBackTime = 0L

    override fun handleOnBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
            return
        }

        val now = System.currentTimeMillis()
        if (now - lastBackTime < AppConfig.EXIT_INTERVAL_MS) {
            activity.finish()
        } else {
            lastBackTime = now
            Toast.makeText(activity, "再按一次退出应用", Toast.LENGTH_SHORT).show()
        }
    }
}
