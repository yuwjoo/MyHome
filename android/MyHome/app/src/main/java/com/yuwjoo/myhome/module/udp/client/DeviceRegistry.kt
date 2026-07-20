package com.yuwjoo.myhome.module.udp.client

import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/**
 * 设备注册表：管理 LAN 中发现的所有设备，提供增删改查和在线状态跟踪
 */

/**
 * LAN 设备信息
 */
data class LanDevice(
    val ip: String, // 设备 IP
    val deviceName: String = "", // 设备名称
    val abilities: List<String> = emptyList(), // 设备能力列表
    val online: Boolean = false, // 是否在线
    val lastSeenAt: Long = 0L, // 最后在线时间戳
)

internal class DeviceRegistry {

    private val devices = ConcurrentHashMap<String, LanDevice>() // 设备注册表（线程安全）

    var onDeviceChanged: (() -> Unit)? = null // 设备变更通知

    /**
     * 注册或更新设备
     *
     * @param ip         设备 IP
     * @param deviceName 设备名称（空字符串表示沿用已有）
     * @param abilities  能力列表（空列表表示沿用已有）
     * @return 更新后的设备信息
     */
    fun register(ip: String, deviceName: String, abilities: List<String>): LanDevice {
        val now = System.currentTimeMillis()
        val existing = devices[ip]

        val updated = if (existing != null) {
            val name = deviceName.ifEmpty { existing.deviceName }
            val abs = if (abilities.isNotEmpty()) abilities else existing.abilities
            existing.copy(deviceName = name, abilities = abs, online = true, lastSeenAt = now)
        } else {
            LanDevice(ip = ip, deviceName = deviceName, abilities = abilities.toList(), online = true, lastSeenAt = now)
        }

        val changed = existing == null || !existing.online || existing.deviceName != updated.deviceName
        devices[ip] = updated
        if (changed) onDeviceChanged?.invoke()
        return updated
    }

    /**
     * 标记设备在线（仅更新心跳时间）
     *
     * @return true 表示状态从离线变为在线
     */
    fun markOnline(ip: String): Boolean {
        val device = devices[ip] ?: return false
        if (!device.online) {
            devices[ip] = device.copy(online = true, lastSeenAt = System.currentTimeMillis())
            onDeviceChanged?.invoke()
            return true
        }
        devices[ip] = device.copy(lastSeenAt = System.currentTimeMillis())
        return false
    }

    /**
     * 标记设备离线（收到离线帧时调用）
     *
     * @param ip 设备 IP
     * @return true 表示状态从在线变为离线
     */
    fun markOffline(ip: String): Boolean {
        val device = devices[ip] ?: return false
        if (device.online) {
            devices[ip] = device.copy(online = false)
            onDeviceChanged?.invoke()
            return true
        }
        return false
    }

    /**
     * 检测并标记超时离线设备
     *
     * @param timeoutMs 超时阈值（毫秒）
     * @return 被标记为离线的 IP 列表
     */
    fun detectOffline(timeoutMs: Long = UdpConfig.HEARTBEAT_OFFLINE_TIMEOUT_MS): List<String> {
        val now = System.currentTimeMillis()
        val offlineIps = mutableListOf<String>()

        devices.forEach { (ip, device) ->
            if (device.online && (now - device.lastSeenAt) > timeoutMs) {
                devices[ip] = device.copy(online = false)
                offlineIps.add(ip)
            }
        }

        if (offlineIps.isNotEmpty()) {
            onDeviceChanged?.invoke()
        }
        return offlineIps
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
     * 获取指定 IP 的设备（线程安全副本）
     */
    fun get(ip: String): LanDevice? = devices[ip]

    /**
     * 获取所有设备列表
     */
    fun getAll(): List<LanDevice> = devices.values.toList()

    /**
     * 获取在线设备列表
     */
    fun getOnline(): List<LanDevice> = devices.values.filter { it.online }

    /**
     * 当前设备数量
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

/**
 * 生成本机设备信息的 JSON payload 字节（用于 CALL/ANSWER）
 *
 * @param latestSeq 最新序号
 */
internal fun buildLocalDevicePayload(latestSeq: Int = 0): ByteArray {
    val json = JSONObject().apply {
        put("deviceName", UdpConfig.DEVICE_NAME)
        put("online", true)
        put("abilities", JSONArray(UdpConfig.DEVICE_ABILITIES))
        put("latestSeq", latestSeq)
    }
    return json.toString().toByteArray(Charsets.UTF_8)
}
