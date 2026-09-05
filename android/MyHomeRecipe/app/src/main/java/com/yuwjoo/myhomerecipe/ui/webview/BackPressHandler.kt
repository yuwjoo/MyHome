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
 * 1. 网页存在跨文档历史 -> 网页回退
 * 2. 同文档历史（SPA 路由 / 全屏弹层）-> 交给页面执行 history.back()，
 *    由页面决定关闭弹层或回退路由；页面无可退时返回 false
 * 3. 连续按两次 -> 退出应用
 *
 * 说明：Android WebView 的 canGoBack() 只识别跨文档历史；本项目为纯 SPA
 * （路由与弹层均为 pushState 的同文档历史），因此绝大多数情况下走第 2 步，
 * 通过页面注册的 __myhomeHandleNativeBack 入口完成“返回先关闭弹层”。
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

        // 同文档回退交给页面判断（返回 true 表示已消费本次返回）
        webView.evaluateJavascript(
            "(window.__myhomeHandleNativeBack ? window.__myhomeHandleNativeBack() : false)",
        ) { result ->
            if (result != "true") {
                handleDoublePressExit()
            }
        }
    }

    private fun handleDoublePressExit() {
        val now = System.currentTimeMillis()
        if (now - lastBackTime < AppConfig.EXIT_INTERVAL_MS) {
            activity.finish()
        } else {
            lastBackTime = now
            Toast.makeText(activity, "再按一次退出应用", Toast.LENGTH_SHORT).show()
        }
    }
}
