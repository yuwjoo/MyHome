package com.yuwjoo.myhome.utils.webviewbridge

import org.json.JSONObject

class WebInterface(private val bridge: WebViewBridge) {
    /**
     * 触发事件
     * @param channelId 通道id
     * @param eventName 事件名称
     * @param payload 负载
     * @param isError 是否异常
     * @param isDone 是否结束
     */
    fun triggerEvent(
        channelId: String,
        eventName: String,
        payload: Any?,
        isError: Boolean,
        isDone: Boolean
    ) {
        val options = JSONObject()
        options.put("channelId", channelId)
        options.put("eventName", eventName)
        options.put("payload", payload)
        options.put("isError", isError)
        options.put("isDone", isDone)
        evalWebFunction("triggerEvent", options.toString())
    }

    /**
     * 抛出异常
     * @param msgText 异常消息
     */
    fun throwError(msgText: String) {
        evalWebFunction("throwError", msgText)
    }

    /**
     * 执行web函数
     * @param funName 函数名称
     * @param params     参数
     */
    private fun evalWebFunction(funName: String, params: String) {
        val scriptText =
            "window." + bridge.config.webInterfaceKey + "." + funName + "(" + params + ");"
        bridge.webView.post { bridge.webView.evaluateJavascript(scriptText, null) }
    }
}