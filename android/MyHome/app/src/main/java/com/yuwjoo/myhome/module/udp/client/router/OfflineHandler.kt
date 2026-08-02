package com.yuwjoo.myhome.module.udp.client.router

import android.util.Log
import com.yuwjoo.myhome.module.udp.client.device.DeviceRegistry

/**
 * 处理 OFFLINE 帧：标记设备离线
 */
internal class OfflineHandler(
    private val deviceRegistry: DeviceRegistry,
) {
    companion object {
        private const val TAG = "OfflineHandler"
    }

    /**
     * 处理离线帧，标记设备为离线状态
     *
     * @param fromIp 发送方 IP
     */
    fun handle(fromIp: String) {
        deviceRegistry.markOffline(fromIp)
        Log.d(TAG, "Device offline: $fromIp")
    }
}
