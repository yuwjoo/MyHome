package com.yuwjoo.myhome.module.peerudp.device

import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig

/**
 * 设备状态
 */
enum class DeviceStatus {
    ONLINE, // 在线：启用心跳且心跳正常
    OFFLINE, // 离线
    UNKNOWN, // 未知：收到过该设备但未启用心跳（heartbeatInterval = 0），无法判定在线/离线
}

/**
 * 设备信息
 */
interface DeviceInfo {
    val ip: String // 设备 IP 地址
    val deviceName: String // 设备名称
    val abilities: List<String> // 设备能力列表（如 "topic:xxx"、"skill:xxx"）
    val status: DeviceStatus // 设备状态（在线/离线/未知）
    val lastOnlineAt: Long // 最后上线时间戳（ms）

    /**
     * 是否包含topic能力
     */
    fun hasTopic(topic: String): Boolean

    /**
     * 是否包含skill能力
     */
    fun hasSkill(skill: String): Boolean
}

/**
 * 局域网设备
 */
data class LanDevice(
    override val ip: String, // 设备 IP 地址
    override val deviceName: String = "", // 设备名称
    override val abilities: List<String> = emptyList(), // 设备能力列表（如 "topic:xxx"、"skill:xxx"）
    val heartbeatInterval: Long = 0L, // 心跳发送间隔（ms）
    val heartbeatTimeout: Long = 0L, // 心跳过期间隔（ms）
    var lastRecvSeq: Int = 0, // 最后接收的序号
    var lastSendSeq: Int = 0, // 最后发送的序号
) : DeviceInfo {
    override var status: DeviceStatus = DeviceStatus.UNKNOWN // 设备状态（在线/离线/未知）
        private set
    override var lastOnlineAt: Long = 0L // 最后上线时间戳（ms）
        private set
    var lastHeartbeat: Long = 0L // 最后心跳时间戳（ms）
        private set

    var onStatusChanged: (() -> Unit)? = null // 设备状态变化回调

    init {
        online()
    }

    /**
     * 设备上线
     */
    fun online() {
        if (heartbeatInterval > 0) {
            if (status != DeviceStatus.ONLINE) {
                status = DeviceStatus.ONLINE
                lastOnlineAt = System.currentTimeMillis()
                onStatusChanged?.invoke()
            }
        } else {
            if (status != DeviceStatus.UNKNOWN) {
                status = DeviceStatus.UNKNOWN
                onStatusChanged?.invoke()
            }
        }
    }

    /**
     * 设备离线
     */
    fun offline() {
        if (status != DeviceStatus.OFFLINE) {
            status = DeviceStatus.OFFLINE
            onStatusChanged?.invoke()
        }
    }

    /**
     * 收到心跳
     */
    fun heartbeat() {
        lastHeartbeat = System.currentTimeMillis()
        if (status != DeviceStatus.ONLINE) {
            status = DeviceStatus.ONLINE
            lastOnlineAt = lastHeartbeat
            onStatusChanged?.invoke()
        }
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
        lastRecvSeq = seq and 0xFFFF
    }

    /**
     * 更新最后发送的序号
     */
    fun updateSendSeq(seq: Int) {
        lastSendSeq = seq and 0xFFFF
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
