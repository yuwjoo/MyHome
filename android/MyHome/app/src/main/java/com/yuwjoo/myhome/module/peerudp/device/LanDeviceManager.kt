package com.yuwjoo.myhome.module.peerudp.device

import com.yuwjoo.myhome.module.peerudp.transport.Transport
import com.yuwjoo.myhome.module.udp.client.config.FrameConfig

/**
 * 局域网设备管理（设备数据管理入口，帧处理逻辑由 PeerUdp 监听层实现）
 */
internal class LanDeviceManager(
    private val transport: Transport, // udp传输器（供消息队列发送帧）
) {

    private val deviceMap = HashMap<String, LanDevice>() // 设备映射表
    private var devices: List<LanDevice> = emptyList() // 设备列表

    val deviceList: List<LanDevice> get() = devices // 设备列表
    val onlineDeviceList: List<LanDevice> get() = devices.filter { it.status == LanDeviceStatus.ONLINE } // 在线设备列表

    var onDeviceListChanged: ((List<LanDevice>) -> Unit)? = null // 设备列表改变监听

    private val aliveChecker = DeviceAliveChecker(deviceMap) // 设备存活检测器
    private val messageQueue = DeviceMessageQueue(
        onSendFrame = { data, seq, ip -> transport.sendFrame(FrameConfig.Type.JSON, data, seq, ip) }, // 发送消息帧
        deviceMap = deviceMap, // 设备映射表
    ) // 设备消息队列
    
    /**
     * 设备通信回调（所有设备共享同一实例）
     *
     * @see LanDeviceCallbacks
     */
    private val deviceCallbacks = object : LanDeviceCallbacks {
        /**
         * 发送有序消息
         *
         * @param device 当前设备对象
         * @param data   待发送数据
         * @param onDone 完成回调（消息处理结束时调用，参数为结果）
         */
        override fun onSendOrdered(device: LanDevice, data: ByteArray, onDone: (status: SendStatus) -> Unit) {
            messageQueue.enqueue(device.ip, data, onDone)
        }

        /**
         * 发送无序消息
         *
         * @param device 当前设备对象
         * @param data   待发送数据
         * @return 是否发送成功
         */
        override fun onSendUnordered(device: LanDevice, data: ByteArray): Boolean =
            transport.sendFrame(FrameConfig.Type.JSON, data, null, device.ip)

        /**
         * 确认消息（收到对应序号的应答时调用，标记消息已送达）
         *
         * @param device  当前设备对象
         * @param seq     已送达的消息序号（收到的 Ack 负载 AckSeq）
         * @param recvSeq 对端当前允许接收的有序消息序号（收到的 Ack 负载 RecvSeq）
         */
        override fun onAck(device: LanDevice, seq: Int, recvSeq: Int) {
            messageQueue.ack(device.ip, seq, recvSeq)
        }

        /**
         * 设备状态变化回调
         *
         * @param device 当前设备对象
         */
        override fun onStatusChanged(device: LanDevice) {
            onDeviceListChanged?.invoke(devices) // 状态变化时同步触发设备列表更新
        }
    }

    /**
     * 判断指定设备是否存在
     *
     * @param ip 设备 IP
     * @return true 存在，false 不存在
     */
    fun containsDevice(ip: String): Boolean {
        return deviceMap.containsKey(ip)
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
     * 添加设备：不存在则创建并保存到设备映射表，监听设备状态变化；已存在则直接返回
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
    ): LanDevice {
        val device = deviceMap[ip] ?: LanDevice(
            ip = ip,
            deviceName = deviceName,
            abilities = abilities,
            heartbeatInterval = heartbeatInterval,
            heartbeatTimeout = heartbeatTimeout,
            callbacks = deviceCallbacks,
        ).also { newDevice ->
            deviceMap[ip] = newDevice // 保存到设备映射表
        }
        handleDeviceMapChanged() // 添加完成后手动触发设备映射表改变
        return device
    }

    /**
     * 移除设备
     *
     * @param ip 设备 IP
     */
    fun removeDevice(ip: String) {
        deviceMap.remove(ip)
        handleDeviceMapChanged()
    }

    /**
     * 清除所有设备
     */
    fun clearDevices() {
        deviceMap.clear()
        handleDeviceMapChanged()
    }

    /**
     * 处理设备映射表改变
     */
    private fun handleDeviceMapChanged() {
        devices = deviceMap.values.toList()
        if (devices.any { it.hasHeartbeat }) {
            aliveChecker.start() // 存在启用心跳的设备，启动存活检测器
        } else {
            aliveChecker.stop() // 无启用心跳的设备，停止存活检测器
        }
        onDeviceListChanged?.invoke(devices)
    }
}
