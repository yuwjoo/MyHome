/**
 * 消息 Action 统一接口，每个 messageName 对应一个实现类
 */
package com.yuwjoo.myhome.module.bridge

import org.json.JSONObject

interface MessageAction {
    val name: String

    fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper)
}
