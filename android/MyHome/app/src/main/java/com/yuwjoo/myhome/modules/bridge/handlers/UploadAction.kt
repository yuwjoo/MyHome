/**
 * 获取数据处理
 */
package com.yuwjoo.myhome.modules.bridge.handlers

import com.yuwjoo.myhome.modules.bridge.MessageAction
import com.yuwjoo.myhome.modules.bridge.WebViewHelper
import org.json.JSONObject

class GetDataAction : MessageAction {
    override val name = "getData"

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val id = params.getInt("id")
        val result = JSONObject().apply { put("name", "张三") }
        helper.invokeCallback(groupId, "onSuccess", result)
    }
}
