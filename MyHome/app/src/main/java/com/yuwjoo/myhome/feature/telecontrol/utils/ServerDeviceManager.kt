package com.yuwjoo.myhome.feature.telecontrol.utils

import org.json.JSONObject

/**
 * 服务设备管理器
 */
object ServerDeviceManager {

    /**
     * 服务设备类
     */
    data class ServerDevice(
        val name: String, // 名称
        val isOnline: Boolean, // 是否在线
        val localIp: String? = null, // 内网ip
        val socketPort: Int, // socket端口
        val messageIndex: Long, // 消息序号
        val powerLevel: Int, // 电量
        val updateTime: Long, // 更新时间戳
    )

    val deviceMap = HashMap<String, ServerDevice>() // 服务设备map

    /**
     * 更新
     * @param data 服务设备数据
     * @return 服务设备对象
     */
    fun update(data: JSONObject): ServerDevice? {
        val name = data.optString("name")
        val updateTime = data.optLong("updateTime")
        val oldTarget = deviceMap[name]

        if (updateTime <= (oldTarget?.updateTime ?: -1)) return null

        val isOnline = data.optBoolean("isOnline")
        val localIp = data.optString("localIp")
        val socketPort = data.optInt("socketPort")
        val messageIndex = data.optLong("messageIndex")
        val powerLevel = data.optInt("powerLevel")
        val serverDevice = ServerDevice(
            name,
            isOnline,
            localIp,
            socketPort,
            messageIndex,
            powerLevel,
            updateTime
        )

        deviceMap[name] = serverDevice
        return serverDevice
    }

    /**
     * 删除
     * @param name 服务设备名称
     */
    fun delete(name: String) {
        deviceMap.remove(name)
    }

    /**
     * 获取服务设备
     * @param name 服务设备名称
     * @return 服务设备对象
     */
    fun getDevice(name: String): ServerDevice? {
        return deviceMap[name]
    }
}