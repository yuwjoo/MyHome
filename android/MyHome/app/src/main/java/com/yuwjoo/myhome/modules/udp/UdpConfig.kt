package com.yuwjoo.myhome.modules.udp

internal object UdpConfig {
    const val LISTEN_PORT = 8001
    const val BROADCAST_PORT = 8000
    const val SCAN_COUNT = 3
    const val SCAN_INTERVAL = 1000L
    const val BUFFER_SIZE = 1024
    const val TOPIC_SCAN_DEVICES = "YHHome/scanDevices"
    const val TOPIC_DEVICE_ONLINE = "YHHome/deviceOnline"
}
