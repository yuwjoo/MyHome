package com.yuwjoo.myhome.modules.devices.deviceStatus

/**
 * 设备在线状态变化回调（主线程）
 */
fun interface DeviceStatusCallback {
    /**
     * @param status 当前状态："online" | "offline" | "unknown"
     */
    fun onStatusChanged(status: String)
}
