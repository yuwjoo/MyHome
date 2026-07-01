package com.yuwjoo.myhome.common.topic.base

/**
 * 负载数据基类。
 *
 * 所有负载类继承自此基类，需实现 JSON 序列化与反序列化。
 */
abstract class PayloadDef {
    /**
     * 解析 JSON
     *
     * @param json MQTT 消息内容
     */
    abstract fun fromJson(json: String)

    /**
     * 构造 JSON
     */
    abstract fun toJson(): String
}
