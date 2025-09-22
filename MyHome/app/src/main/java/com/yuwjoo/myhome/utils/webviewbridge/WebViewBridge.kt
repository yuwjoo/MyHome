package com.yuwjoo.myhome.utils.webviewbridge

import android.webkit.WebView
import com.yuwjoo.myhome.utils.webviewbridge.api.Net

class WebViewBridge(val webView: WebView, val config: BridgeConfig = BridgeConfig()) {
    val channelMap = HashMap<String, BridgeChannel>()
    val webInterface = WebInterface(this)
    val router = BridgeRouter()
    val globalChannel = BridgeChannel(this, config.globalEventChannelId)

    init {
        webView.addJavascriptInterface(WebViewInterface(this), config.webViewInterfaceKey)
        channelMap[config.globalEventChannelId] = globalChannel
        
        // 网络相关API
        router.register("net/request", Net::request)
        router.register("net/test", Net::test)
    }
}
