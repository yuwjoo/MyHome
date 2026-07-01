/**
 * 消息 Action 注册中心，通过 Map<String, MessageAction> 路由分发
 */
package com.yuwjoo.myhome.module.bridge

import com.yuwjoo.myhome.common.bridge.BedroomACAction
import com.yuwjoo.myhome.common.bridge.ESP8266Action
import com.yuwjoo.myhome.common.bridge.TempHumidAction
import org.json.JSONObject

class AppMessageHandler(private val helper: WebViewHelper) : NativeMessageHandler {

    private val actions: Map<String, MessageAction> = listOf(
        BedroomACAction(),
        ESP8266Action(),
        TempHumidAction(),
    ).associateBy { it.name }

    override fun handle(messageName: String, params: JSONObject, groupId: String?) {
        actions[messageName]?.execute(params, groupId, helper)
    }
}
