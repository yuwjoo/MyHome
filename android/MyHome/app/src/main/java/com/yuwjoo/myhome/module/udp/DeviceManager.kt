package com.yuwjoo.myhome.module.udp

import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.CopyOnWriteArraySet

/**
 * 设备管理器，维护在线设备记录与设备变更监听。
 */
class DeviceManager {

    private val listeners = CopyOnWriteArraySet<DeviceChangeListener>() // 设备变更监听器集合
    private val devices = mutableMapOf<String, UdpDevice>() // 在线设备（ipAddress → 设备信息）

    val deviceList: List<UdpDevice> // 全部设备列表
        get() = devices.values.toList()

    val onlineDeviceList: List<UdpDevice> // 在线设备列表
        get() = devices.values.filter { it.online }

    /**
     * 注册设备变更监听器
     *
     * @param listener 设备变更回调
     */
    fun registerListener(listener: DeviceChangeListener) {
        listeners.add(listener)
    }

    /**
     * 取消注册设备变更监听器
     *
     * @param listener 已注册的监听器
     */
    fun unregisterListener(listener: DeviceChangeListener) {
        listeners.remove(listener)
    }

    /**
     * 清空所有设备变更监听器
     */
    fun clearListeners() {
        listeners.clear()
    }

    /**
     * 触发所有设备变更监听器
     */
    fun notifyListeners() {
        val list = devices.values.toList()
        listeners.forEach { it.onDeviceChanged(list) }
    }

    /**
     * 更新设备信息
     *
     * @param device 设备信息
     */
    fun updateDevice(device: UdpDevice) {
        val existing = devices[device.ipAddress]
        if (existing == device) return
        devices[device.ipAddress] = device
        notifyListeners()
    }

    /**
     * 清空所有设备记录
     */
    fun clearDevices() {
        devices.clear()
    }
}

data class UdpDevice(
    val ipAddress: String, // IP 地址
    val deviceName: String, // 设备名称
    val online: Boolean, // 在线状态
    val topics: List<String>, // 订阅的主题列表
) {
    companion object {
        /**
         * 从消息负载构造设备信息
         *
         * @param payload 消息负载
         * @param ip      发送方 IP
         * @return 设备信息，解析失败返回 null
         */
        fun fromPayload(payload: JSONObject?, ip: String): UdpDevice? {
            val json = payload ?: return null
            if (ip.isEmpty()) return null
            val topicsArr = json.optJSONArray("topics")
            val topics = if (topicsArr != null) {
                (0 until topicsArr.length()).map { topicsArr.getString(it) }
            } else {
                emptyList()
            }
            return UdpDevice(
                ipAddress = ip,
                deviceName = json.optString("deviceName", ""),
                online = json.optBoolean("online", true),
                topics = topics,
            )
        }

        /**
         * 将设备信息导出为 JSON 消息
         *
         * @param device 设备信息
         * @return JSONObject
         */
        fun toPayload(device: UdpDevice): JSONObject {
            val json = JSONObject()
            json.put("ipAddress", device.ipAddress)
            json.put("deviceName", device.deviceName)
            json.put("online", device.online)
            json.put("topics", JSONArray(device.topics))
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
    fun onDeviceChanged(devices: List<UdpDevice>)
}
