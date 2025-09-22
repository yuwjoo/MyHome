package com.yuwjoo.myhome.activity.main.ui.webview

import android.view.ViewGroup.LayoutParams
import android.webkit.WebView
import android.webkit.WebView.setWebContentsDebuggingEnabled
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.yuwjoo.myhome.BuildConfig
import com.yuwjoo.myhome.utils.webviewbridge.WebViewBridge
import java.lang.ref.WeakReference

private var lastBackPressTime = -1L // 上次点击返回键的时间
private var weakWebView: WeakReference<CustomWebView>? = null // 弱引用webView

/**
 * 获取webView实例
 * @return webview实例
 */
fun getWebview(): CustomWebView? {
    return weakWebView?.get()
}

/**
 * 获取Bridge实例
 * @return Bridge实例
 */
fun getBridge(): WebViewBridge? {
    return getWebview()?.bridge
}

/**
 * 渲染WebView
 * @param activity 当前activity
 * @param modifier 修饰对象
 */
@Composable
fun WebViewRender(activity: ComponentActivity, modifier: Modifier = Modifier) {
    AndroidView(
        factory = {
            CustomWebView(activity).apply {
                weakWebView = WeakReference(this)
                layoutParams = LayoutParams(
                    LayoutParams.MATCH_PARENT,
                    LayoutParams.MATCH_PARENT
                )
                onBackPressed(activity, this)
                if (BuildConfig.IS_DEV_ENV) {
                    loadUrl("http://192.168.1.138:9000") // 开发服务器web地址
                    setWebContentsDebuggingEnabled(true) // 开启debug模式
                } else {
                    loadUrl("file:///android_asset/www/index.html") // 内部静态资源
                }
            }
        },
        update = {
            it.reload()
        },
        modifier = modifier
    )
}

/**
 * 监听返回事件
 * @param activity 当前activity
 * @param webView webView
 */
private fun onBackPressed(activity: ComponentActivity, webView: WebView) {
    val callback = object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            if (webView.canGoBack()) {
                webView.goBack()
                return
            }
            val currentTime = System.currentTimeMillis()
            if (lastBackPressTime == -1L || currentTime - lastBackPressTime >= 2000) {
                // 显示提示信息
                Toast.makeText(activity, "再按一次退出", Toast.LENGTH_SHORT).show()
                // 记录时间
                lastBackPressTime = currentTime
            } else {
                //退出应用
                activity.finish()
            }
        }
    }
    activity.onBackPressedDispatcher.addCallback(activity, callback)
}