package com.yuwjoo.myhome.common.topic.base

/**
 * MQTT 主题定义基类。
 *
 * @param T 负载类型
 */
abstract class TopicDef<T> {
    abstract val topic: String
    abstract val qos: Int
    abstract fun toPayload(json: String): T
}
