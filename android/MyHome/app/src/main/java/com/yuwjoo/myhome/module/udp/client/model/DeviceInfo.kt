package com.yuwjoo.myhome.module.udp.client.model

/**
 * 握手信息模型，用于 CALL/ANSWER 帧负载的序列化
 */
data class DeviceInfo(
    val deviceName: String = "", // 设备名称
    val abilities: List<String> = emptyList(), // 设备能力列表（如 "topic:xxx"、"skill:xxx"）
    val latestSeq: Int = 0, // 我方已处理的来自对端的有序消息最新序号，用于初始化发送起始序号
    val heartbeatInterval: Long = 0L, // 心跳发送间隔（ms），0 表示不发送心跳
    val heartbeatTimeout: Long = 0L, // 心跳过期间隔（ms），超时未收到心跳判定离线
)
