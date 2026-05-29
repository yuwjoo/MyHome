package com.yuwjoo.myhome.utils.webviewbridge

import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONObject

class WebViewInterface(private val bridge: WebViewBridge) {
    /**
     * 调用方法
     * @param optionsText 配置项json字符串
     */
    @JavascriptInterface
    fun callMethod(optionsText: String) {
        val options = JSONObject(optionsText)
        val channelId = options.optString("channelId")
        val apiPath = options.getString("apiPath")
        val payload = options.opt("payload")
        val api = bridge.router.getApiHandler(apiPath)

        api?.let { it(payload, BridgeChannel(bridge, channelId)) }
    }

    /**
     * 触发事件
     * @param optionsText 配置项json字符串
     */
    @JavascriptInterface
    fun triggerEvent(optionsText: String) {
        val options = JSONObject(optionsText)
        val channelId = options.getString("channelId")
        val eventName = options.optString("eventName")
        val payload = options.opt("payload")
        val isDone = options.getBoolean("isDone")
        val targetChannel = bridge.channelMap[channelId] ?: return

        if (eventName.isNotEmpty()) {
            targetChannel.emit(eventName, payload)
        }
        if (isDone) {
            targetChannel.close()
        }
    }

    /**
     * 抛出异常
     * @param message 异常消息
     */
    @JavascriptInterface
    fun throwError(message: String) {
        Log.e("WebViewBridge", message)
    }

    /**
     * 重置bridge
     */
    @JavascriptInterface
    fun resetBridge() {
        val globalChannel = bridge.channelMap[bridge.config.globalEventChannelId]
        globalChannel!!.clearEvent()
        bridge.channelMap.clear()
        bridge.channelMap[bridge.config.globalEventChannelId] = globalChannel
    }
}