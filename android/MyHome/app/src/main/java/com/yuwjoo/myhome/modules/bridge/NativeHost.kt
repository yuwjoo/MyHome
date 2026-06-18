/**
 * window.__nativeHost 对应的 @JavascriptInterface 类
 */
package com.yuwjoo.myhome.modules.bridge

import android.webkit.JavascriptInterface
import org.json.JSONObject

class NativeHost(private val handler: NativeMessageHandler) {

    @JavascriptInterface
    fun platform(): String = "android"

    @JavascriptInterface
    fun call(json: String) {
        val msg = JSONObject(json)
        val messageName = msg.getString("messageName")
        val params = msg.getJSONObject("params")
        val groupId = msg.optString("groupId", "")

        handler.handle(messageName, params, groupId)
    }
}
