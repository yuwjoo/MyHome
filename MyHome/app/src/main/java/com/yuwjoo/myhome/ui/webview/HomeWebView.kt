package com.yuwjoo.myhome.ui.webview

import android.annotation.SuppressLint
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import com.yuwjoo.myhome.common.bridge.module.AlbumModule
import com.yuwjoo.myhome.common.bridge.module.BedroomACModule
import com.yuwjoo.myhome.common.bridge.core.BridgeChannel
import com.yuwjoo.myhome.common.bridge.core.WebViewBridge

@SuppressLint("SetJavaScriptEnabled", "ViewConstructor")
class HomeWebView(val activity: ComponentActivity) : WebView(activity) {

    private var lastBackPressTime: Long = -1 // 上次点击返回键的时间
    val bridge: WebViewBridge = WebViewBridge(this) // bridge实例
    val channel: BridgeChannel get() = bridge.globalChannel // 全局通道实例

    init {
        bridge.apply {
            // 初始化卧室空调模块
            BedroomACModule.init(this)
            // 初始化相册模块
            AlbumModule.init(this)
        }

        settings.javaScriptEnabled = true // 启用javaScript
        settings.domStorageEnabled = true // 启动存储
        settings.allowFileAccess = true // 允许访问文件
        settings.allowContentAccess = true // 允许访问内容

        webViewClient = HomeWebViewClient(activity)
        webChromeClient = HomeWebChromeClient(activity)

        onBackPressed()
    }

    /**
     * 监听返回事件
     */
    private fun onBackPressed() {
        val callback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (canGoBack()) {
                    goBack()
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
}