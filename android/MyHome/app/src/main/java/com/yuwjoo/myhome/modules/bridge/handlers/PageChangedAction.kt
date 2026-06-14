/**
 * 页面切换消息处理
 */
package com.yuwjoo.myhome.modules.bridge.handlers

import android.util.Log
import com.yuwjoo.myhome.modules.bridge.MessageAction
import com.yuwjoo.myhome.modules.bridge.WebViewHelper
import org.json.JSONObject

class PageChangedAction : MessageAction {
    override val name = "pageChanged"

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val route = params.getString("route")
        Log.d("NativeBridge", "页面切换: $route")
    }
}
