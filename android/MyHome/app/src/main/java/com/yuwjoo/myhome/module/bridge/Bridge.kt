package com.yuwjoo.myhome.module.bridge

import android.webkit.WebView
import com.yuwjoo.myhome.module.bridge.core.Dispatcher
import com.yuwjoo.myhome.module.bridge.core.NativeProvider
import com.yuwjoo.myhome.common.bridge.BedroomACGroup
import com.yuwjoo.myhome.common.bridge.ESP8266Group
import com.yuwjoo.myhome.common.bridge.LanUdpGroup
import com.yuwjoo.myhome.common.bridge.SensorGroup

/**
 * 模块入口
 */
object Bridge {

    /**
     * 挂载 bridge 到 WebView 并注册内置分组模块
     *
     * @param webView WebView 实例
     */
    fun mount(webView: WebView) {
        val dispatcher = Dispatcher(webView).also { d ->
            d.register(BedroomACGroup())
            d.register(SensorGroup())
            d.register(ESP8266Group())
            d.register(LanUdpGroup())
        }
        val provider = NativeProvider(dispatcher)

        webView.addJavascriptInterface(provider, BridgeConfig.NATIVE_PROVIDER_KEY)
    }

    /**
     * 销毁 bridge，从 WebView 移除 NativeProvider
     *
     * @param webView WebView 实例
     */
    fun destroy(webView: WebView) {
        webView.removeJavascriptInterface(BridgeConfig.NATIVE_PROVIDER_KEY)
    }
}
