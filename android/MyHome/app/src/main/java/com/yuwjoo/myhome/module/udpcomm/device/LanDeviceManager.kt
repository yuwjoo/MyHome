package com.yuwjoo.myhome.module.udpcomm.device

/**
 * 局域网设备管理
 */
class LanDeviceManager {

    private val deviceMap = HashMap<String, LanDevice>() // 设备映射表
    private val aliveChecker = DeviceAliveChecker( // 设备存活检测器
        getOnlineDevices = { onlineDevices },
        onDeviceOffline = ::handleDeviceOffline,
    )

    val devices: List<LanDevice> get() = deviceMap.values.toList() // 设备列表
    val onlineDevices: List<LanDevice> get() = deviceMap.values.filter { it.online } // 在线设备列表

    var onDeviceListChanged: ((List<LanDevice>) -> Unit)? = null // 设备列表改变监听

    /**
     * 初始化设备
     *
     * @param ip                  设备 IP
     * @param deviceName          设备名称
     * @param abilities           设备能力列表
     * @param heartbeatInterval   心跳发送间隔（ms）
     * @param heartbeatTimeout    心跳过期间隔（ms）
     * @return 记录的设备
     */
    fun initDevice(
        ip: String,
        deviceName: String = "",
        abilities: List<String> = emptyList(),
        heartbeatInterval: Long = 0L,
        heartbeatTimeout: Long = 0L,
    ): LanDevice {
        val device = LanDevice(
            ip = ip,
            deviceName = deviceName,
            abilities = abilities,
            heartbeatInterval = heartbeatInterval,
            heartbeatTimeout = heartbeatTimeout,
        )
        deviceMap[ip] = device
        aliveChecker.start() // 设备列表不为空则启动存活检测（内部有防重复逻辑）
        onDeviceListChanged?.invoke(deviceMap.values.toList())
        return device
    }

    /**
     * 移除设备
     *
     * @param ip 设备 IP
     */
    fun removeDevice(ip: String) {
        deviceMap.remove(ip)
        if (deviceMap.isEmpty()) aliveChecker.stop() // 设备列表为空时停止检测
        onDeviceListChanged?.invoke(deviceMap.values.toList())
    }

    /**
     * 获取指定设备
     *
     * @param ip 设备 IP
     * @return 设备对象，不存在返回 null
     */
    fun getDevice(ip: String): LanDevice? = deviceMap[ip]

    /**
     * 清除设备列表
     */
    fun clearDevices() {
        deviceMap.clear()
        aliveChecker.stop() // 清空后停止检测
        onDeviceListChanged?.invoke(deviceMap.values.toList())
    }

    /**
     * 处理设备离线
     */
    private fun handleDeviceOffline(device: LanDevice) {
        device.offline()
        onDeviceListChanged?.invoke(devices)
    }
}
