package com.yuwjoo.myhome.module.udp.client.transport

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log

/**
 * 网络监听：通过 ConnectivityManager.NetworkCallback 监听 WiFi 连接状态
 *
 * 回调在 [ConnectivityManager.NetworkCallback] 所在线程（主线程）触发，
 * 线程安全问题由调用方自行处理。
 */
internal class NetworkMonitor(private val callback: (available: Boolean) -> Unit) {

    companion object {
        private const val TAG = "NetworkMonitor"
    }

    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    /**
     * 启动监听
     */
    fun start(context: Context) {
        if (networkCallback != null) return
        connectivityManager =
            context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return

        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.d(TAG, "WiFi available")
                callback(true)
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "WiFi lost")
                callback(false)
            }

            override fun onCapabilitiesChanged(
                network: Network,
                networkCapabilities: NetworkCapabilities,
            ) {
                val hasWifi = networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                Log.d(TAG, "WiFi capabilities changed: wifi=$hasWifi, internet=$hasInternet")
                callback(hasWifi)
            }
        }

        connectivityManager?.registerNetworkCallback(request, networkCallback!!)
        Log.i(TAG, "NetworkMonitor started")
    }

    /**
     * 停止监听，注销网络回调
     */
    fun stop() {
        if (networkCallback == null) return
        networkCallback?.let {
            try {
                connectivityManager?.unregisterNetworkCallback(it)
            } catch (_: Exception) {
                // 已注销或无网络权限
            }
        }
        networkCallback = null
        connectivityManager = null
        Log.i(TAG, "NetworkMonitor stopped")
    }
}
