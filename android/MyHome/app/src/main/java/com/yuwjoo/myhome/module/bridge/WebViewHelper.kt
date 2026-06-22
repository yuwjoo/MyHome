/**
 * 封装 invokeCallback / pushEvent，统一通过 evaluateJavascript 与 Web 端通信
 */
package com.yuwjoo.myhome.module.bridge

import android.webkit.WebView
import org.json.JSONObject

class WebViewHelper(private val webView: WebView) {

    fun invokeCallback(groupId: String?, eventName: String, data: Any) {
        if (groupId == null) return

        val js = buildInvokeJs(groupId, eventName, data)
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }

    fun pushEvent(eventName: String, data: Any) {
        val js = buildInvokeJs("__listeners", eventName, data)
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }

    private fun buildInvokeJs(groupId: String, eventName: String, data: Any): String {
        val dataJson = when (data) {
            is String -> data
            is JSONObject -> data.toString()
            else -> JSONObject.wrap(data).toString()
        }
        return """
            window.__webBridge.invoke(
                "$groupId",
                "$eventName",
                $dataJson
            );
        """.trimIndent()
    }
}
