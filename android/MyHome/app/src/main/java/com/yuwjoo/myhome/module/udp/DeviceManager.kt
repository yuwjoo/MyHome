package com.yuwjoo.myhome.module.udp

import com.yuwjoo.myhome.common.ListenerRegistry
import com.yuwjoo.myhome.module.udp.listener.DeviceListener
import com.yuwjoo.myhome.module.udp.model.LanDevice
import com.yuwjoo.myhome.module.udp.model.LocalDevice

/**
 * 设备管理器
 */
class DeviceManager {

    private val listeners = ListenerRegistry<Unit, DeviceListener>() // 设备变更监听器集合
    private val devices = mutableMapOf<String, LanDevice>() // 在线设备（ipAddress → 设备信息）

    val deviceList: List<LanDevice> // 全部设备列表
        get() = devices.values.toList()

    val onlineDeviceList: List<LanDevice> // 在线设备列表
        get() = devices.values.filter { it.online }

    /**
     * 注册设备变更监听器
     *
     * @param listener 设备变更回调
     */
    fun registerListener(listener: DeviceListener) {
        listeners.register(Unit, listener)
    }

    /**
     * 取消注册设备变更监听器
     *
     * @param listener 已注册的监听器
     */
    fun unregisterListener(listener: DeviceListener) {
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
     * 创建本机设备
     *
     * @param online 在线状态
     * @return 本机设备信息
     */
    fun createLocalDevice(online: Boolean = true): LocalDevice {
        return LocalDevice(online = online)
    }

    /**
     * 保存设备
     *
     * @param device 设备信息
     */
    fun saveDevice(device: LanDevice) {
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
     * 更新设备心跳时间
     *
     * @param ipAddress 设备 IP
     */
    fun updateHeartbeatTime(ipAddress: String) {
        val device = devices[ipAddress] ?: return
        val now = System.currentTimeMillis()
        if (device.online) {
            devices[ipAddress] = device.copy(lastHeartbeatTime = now)
        } else {
            devices[ipAddress] = device.copy(online = true, lastHeartbeatTime = now)
            notifyAllListener()
        }
    }

    /**
     * 更新设备在线状态
     *
     * @param ipAddress 设备 IP
     * @param online    在线状态
     */
    fun updateOnlineStatus(ipAddress: String, online: Boolean) {
        val device = devices[ipAddress] ?: return
        if (device.online == online) return
        devices[ipAddress] = device.copy(online = online)
        notifyAllListener()
    }

    /**
     * 将所有设备标记为离线
     */
    fun markAllOffline() {
        var changed = false
        for ((ip, device) in devices) {
            if (device.online) {
                devices[ip] = device.copy(online = false)
                changed = true
            }
        }
        if (changed) notifyAllListener()
    }




