/**
 * 上传消息处理
 */
package com.yuwjoo.myhome.modules.bridge.handlers

import com.yuwjoo.myhome.modules.bridge.MessageAction
import com.yuwjoo.myhome.modules.bridge.WebViewHelper
import org.json.JSONObject

class UploadAction : MessageAction {
    override val name = "upload"

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        helper.invokeCallback(groupId, "onProgress", """{"percent": 50}""")
        helper.invokeCallback(groupId, "onSuccess", """{"url": "https://..."}""")
    }
}
