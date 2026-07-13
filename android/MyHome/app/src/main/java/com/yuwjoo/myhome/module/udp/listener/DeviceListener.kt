package com.yuwjoo.myhome.module.udp.listener

import com.yuwjoo.myhome.module.udp.model.LanDevice

/**
 * 设备变更监听器
 */
fun interface DeviceListener {
    /**
     * 在线设备列表变更时回调
     *
     * @param devices 当前全部在线设备
     */
    fun onDeviceChanged(devices: List<LanDevice>)
}
