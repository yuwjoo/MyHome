package com.yuwjoo.myhome.module.udpcomm.utils

import android.util.Log
import java.net.InetAddress
import java.net.NetworkInterface

/**
 * 网络工具
 */
internal object NetworkUtils {

    private const val TAG = "NetworkUtils"

    /**
     * 收集本机活跃网卡 IP
     */
    fun collectLocalIps(): Set<String> {
        val ips = mutableSetOf<String>()
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val ni = interfaces.nextElement()
                if (!ni.isUp || ni.isLoopback) continue
                val addrs = ni.inetAddresses
                while (addrs.hasMoreElements()) {
                    val addr: InetAddress = addrs.nextElement()
                    val ip = addr.hostAddress ?: continue
                    ips.add(ip)
                }
            }
            Log.d(TAG, "Local IPs: $ips")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to collect local IPs: ${e.message}")
        }
        return ips
    }
}
