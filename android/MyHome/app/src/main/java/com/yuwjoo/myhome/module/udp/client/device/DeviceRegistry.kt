package com.yuwjoo.myhome.module.udp.client.device

import com.yuwjoo.myhome.module.udp.client.model.LanDevice
import java.util.concurrent.ConcurrentHashMap

/**
 * 设备注册表：管理 LAN 中发现的所有设备
 */
internal class DeviceRegistry {

    private val devices = ConcurrentHashMap<String, LanDevice>() // 设备注册表（线程安全）

    var onDeviceChanged: (() -> Unit)? = null // 设备变更通知
    var onDeviceOffline: ((ip: String) -> Unit)? = null // 设备离线通知（用于中止 ACK 重试）

    /**
     * 注册或更新设备
     *
     * @param ip 设备 IP
     * @param deviceName 设备名称
     * @param abilities 设备能力列表
     * @param heartbeatInterval 心跳间隔（毫秒）
     * @param heartbeatTimeout 心跳超时（毫秒）
     * @return 注册后的设备对象
     */
    fun register(
        ip: String,
        deviceName: String,
        abilities: List<String>,
        heartbeatInterval: Long = 0L,
        heartbeatTimeout: Long = 0L,
    ): LanDevice {
        val device = LanDevice(
            ip = ip,
            deviceName = deviceName,
            abilities = abilities.toList(),
            online = true,
            offlineAt = 0L,
            heartbeatInterval = heartbeatInterval,
            heartbeatTimeout = heartbeatTimeout,
        )

        val exists = devices[ip]
        val changed = exists != device
        devices[ip] = device
        if (changed) onDeviceChanged?.invoke()
        return device
    }

    /**
     * 标记设备在线
     *
     * @param ip 设备 IP
     * @return 是否成功标记（设备存在且原为离线时返回 true）
     */
    fun markOnline(ip: String): Boolean {
        val device = devices[ip] ?: return false
        if (!device.online) {
            device.online = true
            device.offlineAt = 0L
            onDeviceChanged?.invoke()
            return true
        }
        return false
    }

    /**
     * 标记设备离线
     *
     * @param ip 设备 IP
     * @return 是否成功标记（设备存在且原为在线时返回 true）
     */
    fun markOffline(ip: String): Boolean {
        val device = devices[ip] ?: return false
        if (device.online) {
            device.online = false
            device.offlineAt = System.currentTimeMillis()
            onDeviceChanged?.invoke()
            onDeviceOffline?.invoke(ip)
            return true
        }
        return false
    }

    /**
     * 移除设备
     *
     * @param ip 设备 IP
     */
    fun remove(ip: String) {
        if (devices.remove(ip) != null) {
            onDeviceChanged?.invoke()
        }
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

    /**
     * 获取在线设备列表
     *
     * @return 在线设备列表
     */
    fun getOnline(): List<LanDevice> = devices.values.filter { it.online }

    /**
     * 获取设备数量
     *
     * @return 设备数量
     */
    fun size(): Int = devices.size

    /**
     * 清空所有设备
     */
    fun clear() {
        devices.clear()
        onDeviceChanged?.invoke()
    }
}
