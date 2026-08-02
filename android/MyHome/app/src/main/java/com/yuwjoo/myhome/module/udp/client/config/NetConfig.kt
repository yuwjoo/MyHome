package com.yuwjoo.myhome.module.udp.client.config

/**
 * 网络配置
 */
internal object NetConfig {
    const val MULTICAST_ADDR = "239.0.0.100" // 组播地址
    const val BROADCAST_ADDR = "255.255.255.255" // 广播地址
    const val PORT = 8899 // 通信端口
    const val BUFFER_SIZE = 1024 // 接收缓冲区大小

    /**
     * 从 IP 提取主机号
     *
     * @param ip IP 地址
     * @return 主机号（0-255），解析失败返回 0
     */
    fun hostId(ip: String): Int = ip.substringAfterLast('.').toIntOrNull() ?: 0
}
