package com.yuwjoo.myhome.common.bridge.core

import android.webkit.WebView

open class WebViewBridge(val webView: WebView, val config: BridgeConfig = BridgeConfig()) {
    val channelMap = HashMap<String, BridgeChannel>()
    val webInterface = WebInterface(this)
    val router = BridgeRouter()
    val globalChannel = BridgeChannel(this, config.globalEventChannelId)

    init {
        webView.addJavascriptInterface(WebViewInterface(this), config.webViewInterfaceKey)
        channelMap[config.globalEventChannelId] = globalChannel
    }
}
