package com.yuwjoo.myhome.module.peerudp.device

/**
 * 局域网设备信息
 */
interface LanDeviceInfo {
    val ip: String // 设备 IP 地址
    val deviceName: String // 设备名称
    val abilities: List<String> // 设备能力列表（如 "topic:xxx"、"skill:xxx"）
    val heartbeatInterval: Long // 心跳发送间隔（ms）
    val heartbeatTimeout: Long // 心跳过期间隔（ms）
    val online: Boolean // 是否在线
    val offlineAt: Long // 离线时间戳（ms）
    val lastRecvSeq: Int // 最后接收的序号
    val lastSendSeq: Int // 最后发送的序号
    val lastHeartbeat: Long // 最后心跳时间戳（ms）

    /**
     * 是否包含topic能力
     */
    fun hasTopic(topic: String): Boolean

    /**
     * 是否包含skill能力
     */
    fun hasSkill(skill: String): Boolean
}
