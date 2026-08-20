package com.yuwjoo.myhome.module.peerudp.device

import com.yuwjoo.myhome.module.peerudp.transport.Transport
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig

/**
 * 局域网设备管理
 */
internal class LanDeviceManager(
    private val transport: Transport, // udp传输器
) {

    private val deviceMap = HashMap<String, LanDevice>() // 设备映射表
    private var devices: List<LanDevice> = emptyList() // 设备列表

    val deviceList: List<LanDevice> get() = devices // 设备列表
    val onlineDeviceList: List<LanDevice> get() = devices.filter { it.status == DeviceStatus.ONLINE } // 在线设备列表

    var onDeviceListChanged: ((List<LanDevice>) -> Unit)? = null // 设备列表改变监听

    private val aliveChecker = DeviceAliveChecker(deviceMap) // 设备存活检测器
    private val messageQueue = DeviceMessageQueue(transport, deviceMap) // 设备消息队列

    init {
        // 监听心跳消息：已记录设备则更新心跳，否则主动向该 IP 发起呼叫
        transport.registerFrameListener(FrameConfig.Type.HEARTBEAT) { _, fromIp ->
            if (deviceMap.containsKey(fromIp)) {
                deviceMap[fromIp]?.heartbeat()
            } else {
                transport.sendFrame(FrameConfig.Type.CALL, ByteArray(0), null, fromIp)
            }
        }
        // 监听呼叫消息：收到即添加/更新对应设备，并回复应答帧
        transport.registerFrameListener(FrameConfig.Type.CALL) { _, fromIp ->
            addDevice(fromIp)
            transport.sendFrame(FrameConfig.Type.ANSWER, ByteArray(0), null, fromIp)
        }
        // 监听应答消息：收到即添加/更新对应设备
        transport.registerFrameListener(FrameConfig.Type.ANSWER) { _, fromIp ->
            addDevice(fromIp)
        }
        // 监听离线通知：收到即移除对应设备
        transport.registerFrameListener(FrameConfig.Type.OFFLINE) { _, fromIp ->
            removeDevice(fromIp)
        }
        // 监听确认消息：收到 Ack 帧即视为对应设备送达
        transport.registerFrameListener(FrameConfig.Type.ACK) { frame, fromIp ->
            deviceMap[fromIp]?.ackMessage(frame.seqNum)
        }
    }

    /**
     * 获取指定设备
     *
     * @param ip 设备 IP
     * @return 设备对象，不存在返回 null
     */
    fun getDevice(ip: String): LanDevice? {
        return deviceMap[ip]
    }

    /**
     * 添加设备
     *
     * @param ip                  设备 IP
     * @param deviceName          设备名称
     * @param abilities           设备能力列表
     * @param heartbeatInterval   心跳发送间隔（ms）
     * @param heartbeatTimeout    心跳过期间隔（ms）
     * @return 设备信息
     */
    fun addDevice(
        ip: String,
        deviceName: String = "",
        abilities: List<String> = emptyList(),
        heartbeatInterval: Long = 0L,
        heartbeatTimeout: Long = 0L,
    ): DeviceInfo {
        val device = LanDevice(
            ip = ip,
            deviceName = deviceName,
            abilities = abilities,
            heartbeatInterval = heartbeatInterval,
            heartbeatTimeout = heartbeatTimeout,
            transport = transport,
            messageQueue = messageQueue,
        )
        device.onStatusChanged = { onDeviceListChanged?.invoke(devices) } // 状态变化时通知列表
        deviceMap[ip]?.onStatusChanged = null // 清理被替换的旧设备回调
        messageQueue.abort(ip) // 清理旧设备的待发送消息
        deviceMap[ip] = device
        handleDeviceMapChanged()
        return device
    }

    /**
     * 移除设备
     *
     * @param ip 设备 IP
     */
    fun removeDevice(ip: String) {
        deviceMap.remove(ip)?.onStatusChanged = null // 清理被移除设备的回调
        handleDeviceMapChanged()
    }

    /**
     * 清除所有设备
     */
    fun clearDevices() {
        deviceMap.values.forEach { it.onStatusChanged = null } // 清理所有设备的回调
        deviceMap.clear()
        handleDeviceMapChanged()
    }

    /**
     * 处理设备映射表改变
     */
    private fun handleDeviceMapChanged() {
        devices = deviceMap.values.toList()
        if (devices.any { it.heartbeatInterval > 0 }) {
            aliveChecker.start() // 存在启用心跳的设备，启动存活检测器
        } else {
            aliveChecker.stop() // 无启用心跳的设备，停止存活检测器
        }
        onDeviceListChanged?.invoke(devices)
    }
}
