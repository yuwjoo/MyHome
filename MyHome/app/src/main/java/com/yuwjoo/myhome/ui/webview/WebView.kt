package com.yuwjoo.myhome.ui.webview

import android.view.ViewGroup.LayoutParams
import android.webkit.WebView.setWebContentsDebuggingEnabled
import androidx.activity.ComponentActivity
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.yuwjoo.myhome.BuildConfig

var myHomeWebView: HomeWebView? = null

/**
 * 渲染webView
 * @param activity 当前activity
 * @param modifier 修饰对象
 */
@Composable
fun MyHomeWebView(activity: ComponentActivity, modifier: Modifier = Modifier) {
    AndroidView(
        factory = {
            myHomeWebView = HomeWebView(activity)
            myHomeWebView!!.layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT
            )
            if (BuildConfig.IS_DEV_ENV) {
                myHomeWebView!!.loadUrl("http://192.168.1.138:9000") // 开发服务器web地址
                setWebContentsDebuggingEnabled(true) // 开启debug模式
            } else {
                myHomeWebView!!.loadUrl("file:///android_asset/www/index.html") // 内部静态资源
            }
            myHomeWebView!!
        },
        update = {
            it.reload()
        },
        modifier = modifier
    )
}