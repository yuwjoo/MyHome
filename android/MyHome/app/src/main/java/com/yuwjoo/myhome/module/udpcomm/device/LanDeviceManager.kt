package com.yuwjoo.myhome.module.udpcomm.device

/**
 * 局域网设备管理
 */
class LanDeviceManager {

    private val devices = HashMap<String, LanDevice>()

    /**
     * 记录设备
     *
     * @param device 设备信息
     */
    fun record(device: LanDevice) {
        devices[device.ip] = device
    }

    /**
     * 移除设备
     *
     * @param ip 设备 IP
     */
    fun remove(ip: String) {
        devices.remove(ip)
    }

    /**
     * 获取指定设备
     *
     * @param ip 设备 IP
     * @return 设备对象，不存在返回 null
     */
    fun get(ip: String): LanDevice? = devices[ip]

    /**
     * 获取所有设备列表
     *
     * @return 所有设备列表
     */
    fun getAll(): List<LanDevice> = devices.values.toList()
}
