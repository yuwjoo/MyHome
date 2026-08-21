package com.yuwjoo.myhome.module.peerudp.device

import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig
import com.yuwjoo.myhome.module.peerudp.frame.FrameCodec
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
                transport.sendFrame(FrameConfig.Type.CALL, localDeviceInfoBytes(), null, fromIp)
            }
        }
        // 监听呼叫消息：解析对端设备信息并注册，回复携带本机设备信息的应答帧
        transport.registerFrameListener(FrameConfig.Type.CALL) { frame, fromIp ->
            frame.payload.parseDeviceInfo()?.let { addDevice(fromIp, it) }
            transport.sendFrame(FrameConfig.Type.ANSWER, localDeviceInfoBytes(), null, fromIp)
        }
        // 监听应答消息：解析对端设备信息并注册
        transport.registerFrameListener(FrameConfig.Type.ANSWER) { frame, fromIp ->
            frame.payload.parseDeviceInfo()?.let { addDevice(fromIp, it) }
        }
        // 监听离线通知：收到即移除对应设备
        transport.registerFrameListener(FrameConfig.Type.OFFLINE) { _, fromIp ->
            removeDevice(fromIp)
        }
        // 监听确认消息：从负载解析 AckSeq 与 RecvAckSeq，视为对应设备送达
        transport.registerFrameListener(FrameConfig.Type.ACK) { frame, fromIp ->
            val (seq, recvSeq) = FrameCodec.decodeAckPayload(frame.payload) ?: return@registerFrameListener
            deviceMap[fromIp]?.ackMessage(seq, recvSeq)
        }
    }

    /**
     * 本机设备信息（用于 Call / Answer 帧负载）
     */
    private fun localDeviceInfo(): DeviceInfoMessage {
        return DeviceInfoMessage(
            deviceName = DeviceConfig.Local.DEVICE_NAME,
            abilities = DeviceConfig.Local.DEVICE_ABILITIES,
            heartbeatInterval = DeviceConfig.Local.HEARTBEAT_INTERVAL_MS,
            heartbeatTimeout = DeviceConfig.Local.HEARTBEAT_TIMEOUT_MS,
        )
    }

    /**
     * 本机设备信息序列化为字节数组
     */
    private fun localDeviceInfoBytes(): ByteArray = deviceInfoToBytes(localDeviceInfo())

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
        return addDevice(
            ip,
            DeviceInfoMessage(deviceName, abilities, heartbeatInterval, heartbeatTimeout),
        )
    }

    /**
     * 添加/更新设备（从 Call / Answer 携带的设备信息）
     *
     * @param ip   设备 IP
     * @param info 设备信息（来自对端 Call / Answer 帧）
     * @return 设备信息
     */
    fun addDevice(ip: String, info: DeviceInfoMessage): DeviceInfo {
        return addDevice(
            ip,
            info.deviceName,
            info.abilities,
            info.heartbeatInterval,
            info.heartbeatTimeout,
        )
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
