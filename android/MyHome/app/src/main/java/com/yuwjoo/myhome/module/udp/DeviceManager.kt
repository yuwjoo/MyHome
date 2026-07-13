package com.yuwjoo.myhome.module.udp

import com.yuwjoo.myhome.common.ListenerRegistry
import org.json.JSONArray
import org.json.JSONObject

/**
 * 设备管理器，维护在线设备记录与设备变更监听。
 */
class DeviceManager {

    private val listeners = ListenerRegistry<Unit, DeviceChangeListener>() // 设备变更监听器集合
    private val devices = mutableMapOf<String, UdpLocalDevice>() // 在线设备（ipAddress → 设备信息）

    val deviceList: List<UdpLocalDevice> // 全部设备列表
        get() = devices.values.toList()

    val onlineDeviceList: List<UdpLocalDevice> // 在线设备列表
        get() = devices.values.filter { it.online }

    /**
     * 注册设备变更监听器
     *
     * @param listener 设备变更回调
     */
    fun registerListener(listener: DeviceChangeListener) {
        listeners.register(Unit, listener)
    }

    /**
     * 取消注册设备变更监听器
     *
     * @param listener 已注册的监听器
     */
    fun unregisterListener(listener: DeviceChangeListener) {
        listeners.unregister(Unit, listener)
    }

    /**
     * 清空所有设备变更监听器
     */
    fun clearAllListener() {
        listeners.clearAll()
    }

    /**
     * 触发所有设备变更监听器
     */
    fun notifyAllListener() {
        val list = devices.values.toList()
        listeners.dispatch(Unit) { it.onDeviceChanged(list) }
    }

    /**
     * 保存设备
     *
     * @param device 设备信息
     */
    fun saveDevice(device: UdpLocalDevice) {
        if (devices[device.ipAddress] == device) return
        devices[device.ipAddress] = device
        notifyAllListener()
    }

    /**
     * 移除设备
     *
     * @param ipAddress 设备 IP
     */
    fun removeDevice(ipAddress: String) {
        if (devices.remove(ipAddress) != null) {
            notifyAllListener()
        }
    }

    /**
     * 清空所有设备
     */
    fun clearAllDevice() {
        devices.clear()
    }

    /**
     * 检查 IP 对应的设备是否存在
     *
     * @param ipAddress 设备 IP
     */
    fun hasDevice(ipAddress: String): Boolean = devices.containsKey(ipAddress)

    /**
     * 更新设备心跳时间（收到心跳响应时调用）
     *
     * @param ipAddress 设备 IP
     */
    fun updateHeartbeat(ipAddress: String) {
        val device = devices[ipAddress] ?: return
        val now = System.currentTimeMillis()
        val updated = if (device.online) {
            device.copy(lastHeartbeatTime = now)
        } else {
            device.copy(online = true, lastHeartbeatTime = now)
        }
        devices[ipAddress] = updated
        notifyAllListener()
    }

    /**
     * 将设备标记为离线
     *
     * @param ipAddress 设备 IP
     */
    fun markOffline(ipAddress: String) {
        val device = devices[ipAddress] ?: return
        if (device.online) {
            devices[ipAddress] = device.copy(online = false)
            notifyAllListener()
        }
    }
}

data class UdpLocalDevice(
    val ipAddress: String, // IP 地址
    val deviceName: String, // 设备名称
    val online: Boolean, // 在线状态
    val abilities: List<String>, // 能力列表（如 "topic:xxx"、"skill:xxx"）
    val lastHeartbeatTime: Long = System.currentTimeMillis(), // 最后一次心跳时间
) {
    companion object {
        /**
         * 从消息负载构造设备信息
         *
         * @param payload 消息负载
         * @param ip      发送方 IP
         * @return 设备信息，解析失败返回 null
         */
        fun fromPayload(payload: JSONObject?, ip: String): UdpLocalDevice? {
            val json = payload ?: return null
            if (ip.isEmpty()) return null
            val abilitiesArr = json.optJSONArray("abilities")
            val abilities = if (abilitiesArr != null) {
                (0 until abilitiesArr.length()).map { abilitiesArr.getString(it) }
            } else {
                emptyList()
            }
            return UdpLocalDevice(
                ipAddress = ip,
                deviceName = json.optString("deviceName", ""),
                online = json.optBoolean("online", true),
                abilities = abilities,
            )
        }

        /**
         * 将设备信息导出为 JSON 消息
         *
         * @param device 设备信息
         * @return JSONObject
         */
        fun toPayload(device: UdpLocalDevice): JSONObject {
            val json = JSONObject()
            json.put("ipAddress", device.ipAddress)
            json.put("deviceName", device.deviceName)
            json.put("online", device.online)
            json.put("abilities", JSONArray(device.abilities))
            return json
        }
    }
}

/**
 * 设备变更监听器。
 */
fun interface DeviceChangeListener {
    /**
     * 在线设备列表变更时回调
     *
     * @param devices 当前全部已发现的在线设备
     */
    fun onDeviceChanged(devices: List<UdpLocalDevice>)
}
