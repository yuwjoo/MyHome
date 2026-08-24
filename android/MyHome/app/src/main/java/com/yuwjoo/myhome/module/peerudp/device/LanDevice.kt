package com.yuwjoo.myhome.module.peerudp.device

import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig

/**
 * 设备状态
 */
enum class LanDeviceStatus {
    ONLINE, // 在线：启用心跳且心跳正常
    OFFLINE, // 离线
    UNKNOWN, // 未知：收到过该设备但未启用心跳（heartbeatInterval = 0），无法判定在线/离线
}

/**
 * 设备通信回调（由 LanDeviceManager 注入，LanDevice 与发送/确认具体实现解耦）
 */
interface LanDeviceCallbacks {
    /**
     * 发送有序消息
     *
     * @param device 当前设备对象
     * @param data   待发送数据
     * @param onDone 完成回调（消息处理结束时调用，参数为结果）
     */
    fun onSendOrdered(device: LanDevice, data: ByteArray, onDone: (status: SendStatus) -> Unit)

    /**
     * 发送无序消息
     *
     * @param device 当前设备对象
     * @param data   待发送数据
     * @return 是否发送成功
     */
    fun onSendUnordered(device: LanDevice, data: ByteArray): Boolean

    /**
     * 确认消息（收到对应序号的应答时调用，标记消息已送达）
     *
     * @param device  当前设备对象
     * @param seq     已送达的消息序号（收到的 Ack 负载 AckSeq）
     * @param recvSeq 对端当前允许接收的有序消息序号（收到的 Ack 负载 RecvSeq）
     */
    fun onAck(device: LanDevice, seq: Int, recvSeq: Int)

    /**
     * 设备状态变化回调
     *
     * @param device 当前设备对象
     */
    fun onStatusChanged(device: LanDevice)
}

/**
 * 局域网设备
 */
internal class LanDevice(
    val ip: String, // 设备 IP 地址
    val deviceName: String = "", // 设备名称
    val abilities: List<String> = emptyList(), // 设备能力列表（如 "topic:xxx"、"skill:xxx"）
    val heartbeatInterval: Long = 0L, // 心跳发送间隔（ms）
    val heartbeatTimeout: Long = 0L, // 心跳过期间隔（ms）
    private val callbacks: LanDeviceCallbacks, // 设备通信回调
) {
    var lastRecvSeq: Int = 0 // 最后接收的序号
        set(value) { field = value and 0xFFFF }

    var lastSendSeq: Int = 0 // 最后发送的序号
        set(value) { field = value and 0xFFFF }

    var status: LanDeviceStatus = if (hasHeartbeat) LanDeviceStatus.ONLINE else LanDeviceStatus.UNKNOWN // 设备状态（在线/离线/未知）
        private set

    var lastOnlineAt: Long = System.currentTimeMillis() // 最后上线时间戳（ms）
        private set

    var lastHeartbeat: Long = System.currentTimeMillis() // 最后心跳时间戳（ms）
        private set

    val hasHeartbeat: Boolean get() = heartbeatInterval > 0 // 是否启用心跳

    val nextRecvSeq: Int get() = (lastRecvSeq + 1) and 0xFFFF // 下一个接收序号
    
    val nextSendSeq: Int get() = (lastSendSeq + 1) and 0xFFFF // 下一个发送序号

    /**
     * 设备上线
     */
    fun online() {
        updateStatus(if (hasHeartbeat) LanDeviceStatus.ONLINE else LanDeviceStatus.UNKNOWN)
    }

    /**
     * 设备离线
     */
    fun offline() {
        updateStatus(LanDeviceStatus.OFFLINE)
    }

    /**
     * 收到心跳
     */
    fun heartbeat() {
        lastHeartbeat = System.currentTimeMillis()
        updateStatus(LanDeviceStatus.ONLINE)
    }

    /**
     * 是否包含topic能力
     */
    fun hasTopic(topic: String): Boolean = abilities.contains("${DeviceConfig.ABILITY_PREFIX_TOPIC}$topic")

    /**
     * 是否包含skill能力
     */
    fun hasSkill(skill: String): Boolean = abilities.contains("${DeviceConfig.ABILITY_PREFIX_SKILL}$skill")

    /**
     * 发送有序消息（加入消息队列，带重试等待应答）
     *
     * @param data   待发送数据
     * @param onDone 完成回调（消息处理结束时调用，参数为结果，可省略）
     */
    fun sendOrderedMessage(
        data: ByteArray,
        onDone: (status: SendStatus) -> Unit = {},
    ) {
        callbacks.onSendOrdered(this, data, onDone)
    }

    /**
     * 发送无序消息（直接发送，无应答、无重试）
     *
     * @param data 待发送数据
     * @return 是否发送成功
     */
    fun sendUnorderedMessage(data: ByteArray): Boolean = callbacks.onSendUnordered(this, data)

    /**
     * 确认消息（收到对应序号的应答时调用，标记消息已送达）
     *
     * @param seq       已送达的消息序号（收到的 Ack 负载 AckSeq）
     * @param recvSeq   对端当前允许接收的有序消息序号（收到的 Ack 负载 RecvSeq）
     */
    fun ackMessage(seq: Int, recvSeq: Int) {
        callbacks.onAck(this, seq, recvSeq)
    }

    /**
     * 更新设备状态
     *
     * @param status 目标状态
     */
    private fun updateStatus(status: LanDeviceStatus) {
        if (this.status != status) {
            this.status = status
            if (status == LanDeviceStatus.ONLINE) {
                lastOnlineAt = System.currentTimeMillis()
            }
            callbacks.onStatusChanged(this)
        }
    }
}
