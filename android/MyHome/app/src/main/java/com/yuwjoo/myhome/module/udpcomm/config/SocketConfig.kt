package com.yuwjoo.myhome.module.udpcomm.config

/**
 * Socket 层网络配置常量
 */
internal object SocketConfig {
    const val MULTICAST_ADDRESS = "239.0.0.100"       // 组播地址
    const val BROADCAST_ADDRESS = "255.255.255.255"   // 广播地址
    const val PORT = 8899                          // 通信端口
    const val BUFFER_SIZE = 2048                   // 接收缓冲区大小
}
