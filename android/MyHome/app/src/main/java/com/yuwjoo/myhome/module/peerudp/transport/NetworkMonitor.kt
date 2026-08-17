package com.yuwjoo.myhome.module.peerudp.transport

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log

/**
 * 网络变化监听器
 */
internal class NetworkMonitor(
    private val onNetworkChanged: (available: Boolean) -> Unit, // 网络可用性变化回调
) {

    companion object {
        private const val TAG = "NetworkMonitor"
    }

    private var connectivityManager: ConnectivityManager? = null // 连接管理器
    private var networkCallback: ConnectivityManager.NetworkCallback? = null // 网络回调

    /**
     * 启动网络监听
     *
     * @param context 用于获取 ConnectivityManager
     */
    fun start(context: Context) {
        if (networkCallback != null) return

        connectivityManager =
            context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: run {
                Log.e(TAG, "ConnectivityManager is null")
                return
            }

        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {

            override fun onAvailable(network: Network) {
                Log.d(TAG, "WiFi available")
                onNetworkChanged(true)
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "WiFi lost")
                onNetworkChanged(false)
            }

            override fun onCapabilitiesChanged(
                network: Network,
                capabilities: NetworkCapabilities,
            ) {
                val hasWifi = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                Log.d(TAG, "WiFi capabilities changed: hasWifi=$hasWifi")
                onNetworkChanged(hasWifi)
            }
        }

        connectivityManager?.registerNetworkCallback(request, networkCallback!!)
        Log.i(TAG, "NetworkMonitor started")
    }

    /**
     * 停止网络监听
     */
    fun stop() {
        if (networkCallback == null) return
        try {
            connectivityManager?.unregisterNetworkCallback(networkCallback!!)
        } catch (_: Exception) {
            // 已注销或无权限
        }
        networkCallback = null
        connectivityManager = null
        Log.i(TAG, "NetworkMonitor stopped")
    }
}
