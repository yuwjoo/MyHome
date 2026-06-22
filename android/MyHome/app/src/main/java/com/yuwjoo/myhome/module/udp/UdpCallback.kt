package com.yuwjoo.myhome.module.udp

interface UdpCallback {
    /**
     * 设备列表发生变化（scanDevices 收到应答时回调）
     * @param devices 当前全部已发现的设备
     */
    fun onDeviceChanged(devices: List<UdpDevice>)

    /**
     * 收到任意 Topic 消息
     * @param topic   消息主题
     * @param payload 消息内容
     */
    fun onMessageArrived(topic: String, payload: Any?)
}
