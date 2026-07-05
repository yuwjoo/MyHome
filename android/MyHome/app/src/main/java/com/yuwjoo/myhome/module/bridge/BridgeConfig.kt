package com.yuwjoo.myhome.module.bridge

/**
 * 模块配置
 */
object BridgeConfig {
    // native provider 在 window 上的挂载 key
    const val NATIVE_PROVIDER_KEY = "__bridge:native-provider__"
    // 消息接收器在 window 上的挂载 key
    const val MESSAGE_RECEIVER_KEY = "__bridge:message-receiver__"
    // 监听事件消息 ID
    const val LISTEN_EVENT_MESSAGE_ID = "listen-event-message-id"
}
