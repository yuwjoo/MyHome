package com.yuwjoo.myhome.module.bridge.core

import android.webkit.WebView
import com.yuwjoo.myhome.module.bridge.annotation.BridgeGroup
import com.yuwjoo.myhome.module.bridge.annotation.BridgeMessage
import org.json.JSONObject
import java.lang.reflect.Method

/**
 * 消息分发器
 */
class Dispatcher(private val webView: WebView) {

    // groupName → (messageName → (instance, method))
    private val routes: MutableMap<String, MutableMap<String, Pair<Any, Method>>> = mutableMapOf()

    /**
     * 注册分组实例，扫描类上的 @BridgeGroup 和方法上的 @BridgeMessage 注解
     */
    fun register(instance: Any) {
        val clazz = instance.javaClass
        val groupAnn = clazz.getAnnotation(BridgeGroup::class.java) ?: return
        val groupName = groupAnn.value

        val messageMap = routes.getOrPut(groupName) { mutableMapOf() }

        clazz.declaredMethods.forEach { method ->
            val msgAnn = method.getAnnotation(BridgeMessage::class.java) ?: return@forEach
            messageMap[msgAnn.value] = instance to method
        }
    }

    /**
     * 分发消息到对应的处理方法
     */
    fun dispatch(groupName: String, messageName: String, messageId: String, params: JSONObject) {
        val (instance, method) = routes[groupName]?.get(messageName) ?: return
        val sender = MessageSender(webView, groupName, messageId)

        try {
            method.invoke(instance, params, sender)
        } catch (_: Exception) {
        }
    }
}
