/**
 * 原生端消息处理接口，由 AppMessageHandler 实现
 */
package com.yuwjoo.myhome.module.bridge

import org.json.JSONObject

interface NativeMessageHandler {
    fun handle(messageName: String, params: JSONObject, groupId: String?)
}
