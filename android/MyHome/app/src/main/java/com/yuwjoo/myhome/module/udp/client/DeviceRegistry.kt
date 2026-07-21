package com.yuwjoo.myhome.module.udp.client

import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/**
 * LAN 设备信息
 */
data class LanDevice(
    val ip: String, // 设备 IP
    val deviceName: String = "", // 设备名称
    val abilities: List<String> = emptyList(), // 设备能力列表
    var online: Boolean = false // 是否在线（同文件内可写，外部只读）
        private set,
    var offlineAt: Long = 0L // 离线时间戳，0 表示当前在线（同文件内可写，外部只读）
        private set,
    val heartbeatInterval: Long = 0L, // 心跳间隔（ms），0 表示不发送心跳
    val heartbeatTimeout: Long = 0L, // 心跳过期间隔（ms）
)

/**
 * 设备注册表：管理 LAN 中发现的所有设备
 */
internal class DeviceRegistry {

    private val devices = ConcurrentHashMap<String, LanDevice>() // 设备注册表（线程安全）

    var onDeviceChanged: (() -> Unit)? = null // 设备变更通知
    var onDeviceOffline: ((ip: String) -> Unit)? = null // 设备离线通知（用于中止 ACK 重试）

    /**
     * 注册或更新设备
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
     * 标记设备在线（仅更新心跳时间）
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

    fun remove(ip: String) {
        if (devices.remove(ip) != null) {
            onDeviceChanged?.invoke()
        }
    }

    fun get(ip: String): LanDevice? = devices[ip]

    fun getAll(): List<LanDevice> = devices.values.toList()

    fun getOnline(): List<LanDevice> = devices.values.filter { it.online }

    fun size(): Int = devices.size

    fun clear() {
        devices.clear()
        onDeviceChanged?.invoke()
    }
}

/**
 * 生成本机设备信息的 JSON payload（用于 CALL/ANSWER）
 *
 * @param latestSeq 本机对目标主机记录的最新有序序号
 */
internal fun buildLocalDevicePayload(latestSeq: Int = 0): ByteArray {
    val json = JSONObject().apply {
        put("deviceName", ClientConfig.DEVICE_NAME)
        put("abilities", JSONArray(ClientConfig.DEVICE_ABILITIES))
        put("latestSeq", latestSeq)
        put("heartbeatInterval", ClientConfig.HEARTBEAT_INTERVAL_MS)
        put("heartbeatTimeout", ClientConfig.HEARTBEAT_TIMEOUT_MS)
    }
    return json.toString().toByteArray(Charsets.UTF_8)
}
