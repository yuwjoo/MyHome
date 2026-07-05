package com.yuwjoo.myhome.module.bridge.core

import android.webkit.JavascriptInterface
import org.json.JSONObject

/**
 * 原生端入口
 */
class NativeProvider(private val dispatcher: Dispatcher) {

    @JavascriptInterface
    fun platform(): String = "android"

    @JavascriptInterface
    fun onMessage(json: String) {
        val msg = JSONObject(json)
        val groupName = msg.getString("groupName")
        val messageName = msg.getString("messageName")
        val messageId = msg.getString("messageId")
        val params = msg.optJSONObject("params") ?: JSONObject()

        dispatcher.dispatch(groupName, messageName, messageId, params)
    }
}
