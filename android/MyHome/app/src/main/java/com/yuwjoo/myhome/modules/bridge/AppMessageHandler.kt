/**
 * 消息 Action 注册中心，通过 Map<String, MessageAction> 路由分发
 */
package com.yuwjoo.myhome.modules.bridge

import com.yuwjoo.myhome.modules.bridge.handlers.BedroomACAction
import com.yuwjoo.myhome.modules.bridge.handlers.DeviceStatusAction
import com.yuwjoo.myhome.modules.bridge.handlers.TempHumidAction
import org.json.JSONObject

class AppMessageHandler(private val helper: WebViewHelper) : NativeMessageHandler {

    private val actions: Map<String, MessageAction> = listOf(
        BedroomACAction(),
        DeviceStatusAction(),
        TempHumidAction(),
    ).associateBy { it.name }

    override fun handle(messageName: String, params: JSONObject, groupId: String?) {
        actions[messageName]?.execute(params, groupId, helper)
    }
}
