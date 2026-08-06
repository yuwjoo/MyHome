package com.yuwjoo.myhome.module.udpcomm.device

/**
 * 局域网设备
 *
 * @property ip                   设备 IP 地址
 * @property deviceName           设备名称
 * @property abilities            设备能力列表（如 "topic:xxx"、"skill:xxx"）
 * @property online               是否在线
 * @property offlineAt            离线时间戳（ms），用于超时检测
 * @property heartbeatInterval    心跳发送间隔（ms）
 * @property heartbeatTimeout     心跳过期间隔（ms）
 */
data class LanDevice(
    val ip: String,
    val deviceName: String = "",
    val abilities: List<String> = emptyList(),
    online: Boolean = false,
    offlineAt: Long = 0L,
    val heartbeatInterval: Long = 0L,
    val heartbeatTimeout: Long = 0L,
) {
    var online: Boolean = online
        private set
    var offlineAt: Long = offlineAt
        private set

    /**
     * 标记设备上线
     */
    fun goOnline() {
        online = true
        offlineAt = 0L
    }

    /**
     * 标记设备离线
     */
    fun goOffline() {
        online = false
        offlineAt = System.currentTimeMillis()
    }
}
