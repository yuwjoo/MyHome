package com.yuwjoo.myhome.modules.udp

data class UdpDevice(
    val ipAddress: String,
    val port: Int,
    val deviceId: String,
    val deviceName: String,
    val deviceType: String,
)
