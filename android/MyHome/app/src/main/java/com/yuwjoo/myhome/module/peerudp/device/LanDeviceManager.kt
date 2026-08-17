package com.yuwjoo.myhome.module.peerudp.device

/**
 * 局域网设备管理
 */
class LanDeviceManager {

    private val deviceMap = HashMap<String, LanDevice>() // 设备映射表
    private var devices: List<LanDevice> = emptyList() // 设备列表

    val deviceInfoList: List<DeviceInfo> get() = devices // 设备信息列表
    val onlineDeviceInfoList: List<DeviceInfo> get() = devices.filter { it.status == DeviceStatus.ONLINE } // 在线设备信息列表

    var onDeviceListChanged: ((List<DeviceInfo>) -> Unit)? = null // 设备列表改变监听
    
    private val aliveChecker = DeviceAliveChecker(deviceMap) // 设备存活检测器

    /**
     * 获取指定设备信息
     *
     * @param ip 设备 IP
     * @return 设备信息对象，不存在返回 null
     */
    fun getDeviceInfo(ip: String): DeviceInfo? {
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
        )
        device.onStatusChanged = { onDeviceListChanged?.invoke(devices) } // 状态变化时通知列表
        deviceMap[ip]?.onStatusChanged = null // 清理被替换的旧设备回调
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
