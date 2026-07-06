package com.yuwjoo.myhome.module.bridge.core

import android.webkit.WebView
import com.yuwjoo.myhome.module.bridge.BridgeConfig
import org.json.JSONObject

/**
 * 消息发送器
 */
class MessageSender(
    private val webView: WebView,
    private val groupName: String,
    private val messageId: String,
) {
    private val receiverPath: String = "window['${BridgeConfig.MESSAGE_RECEIVER_KEY}']"

    /**
     * 发送消息到 web 端
     *
     * @param callbackName 回调名称
     * @param data         回传数据（可选）
     * @param isEnd        是否标记消息结束，清除该消息所有回调（可选）
     * @param isRetained   是否保留数据，供后续新注册的回调直接获取（可选）
     */
    fun send(callbackName: String, data: JSONObject? = null, isEnd: Boolean = false, isRetained: Boolean = false) {
        val msg = JSONObject().apply {
            put("groupName", groupName)
            put("messageId", messageId)
            put("callbackName", callbackName)
            if (data != null) put("data", data)
            if (isEnd) put("isEnd", true)
            if (isRetained) put("isRetained", true)
        }
        evaluateJs("$receiverPath.onMessage(${JSONObject.quote(msg.toString())})")
    }
    
    /**
     * 发送事件消息
     *
     * @param data       回传数据（可选）
     * @param isRetained 是否保留数据，供后续新注册的回调直接获取（可选）
     */
    fun sendEventMessage(data: JSONObject? = null, isRetained: Boolean = false) {
        send("onMessage", data, isRetained = isRetained)
    }

    /**
     * 发送结束消息
     *
     * @param callbackName 回调名称
     * @param data         回传数据（可选）
     */
    fun sendEndMessage(callbackName: String, data: JSONObject? = null) {
        send(callbackName, data, isEnd = true)
    }

    private fun evaluateJs(js: String) {
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }
}
