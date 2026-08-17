package com.yuwjoo.myhome.module.peerudp.device

import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig

/**
 * 局域网设备
 *
 * @property ip                   设备 IP 地址
 * @property deviceName           设备名称
 * @property abilities            设备能力列表（如 "topic:xxx"、"skill:xxx"）
 * @property online               是否在线
 * @property offlineAt            离线时间戳（ms）
 * @property heartbeatInterval    心跳发送间隔（ms）
 * @property heartbeatTimeout     心跳过期间隔（ms）
 * @property lastRecvSeq          最后接收的序号
 * @property lastSendSeq          最后发送的序号
 * @property lastHeartbeat        最后心跳时间戳（ms）
 */
data class LanDevice(
    override val ip: String,
    override val deviceName: String = "",
    override val abilities: List<String> = emptyList(),
    override val heartbeatInterval: Long = 0L,
    override val heartbeatTimeout: Long = 0L,
) : LanDeviceInfo {
    override var online: Boolean = true
        private set
    override var offlineAt: Long = 0L
        private set
    override var lastRecvSeq: Int = 0
        private set
    override var lastSendSeq: Int = 0
        private set
    override var lastHeartbeat: Long = System.currentTimeMillis()
        private set

    /**
     * 设备上线
     */
    fun online() {
        online = true
        offlineAt = 0L
    }

    /**
     * 设备离线
     */
    fun offline() {
        online = false
        offlineAt = System.currentTimeMillis()
    }

    /**
     * 收到心跳
     */
    fun heartbeat() {
        lastHeartbeat = System.currentTimeMillis()
    }

    /**
     * 是否包含topic能力
     */
    override fun hasTopic(topic: String): Boolean = abilities.contains("${DeviceConfig.ABILITY_PREFIX_TOPIC}$topic")

    /**
     * 是否包含skill能力
     */
    override fun hasSkill(skill: String): Boolean = abilities.contains("${DeviceConfig.ABILITY_PREFIX_SKILL}$skill")

    /**
     * 更新最后接收的序号
     */
    fun updateRecvSeq(seq: Int) {
        lastRecvSeq = seq
    }

    /**
     * 更新最后发送的序号
     */
    fun updateSendSeq(seq: Int) {
        lastSendSeq = seq
    }

    /**
     * 获取下一个接收序号
     */
    fun nextRecvSeq(): Int {
        return (lastRecvSeq + 1) and 0xFFFF
    }

    /**
     * 获取下一个发送序号
     */
    fun nextSendSeq(): Int {
        return (lastSendSeq + 1) and 0xFFFF
    }
}
