package com.yuwjoo.myhome.module.udp.client

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log

/**
 * 网络监听：通过 ConnectivityManager.NetworkCallback 监听 WiFi 连接状态
 */
internal class NetworkMonitor {

    companion object {
        private const val TAG = "NetworkMonitor"
    }

    private var callback: ((available: Boolean) -> Unit)? = null // 网络状态变化回调
    private var connectivityManager: ConnectivityManager? = null // 网络连接管理器
    private var networkCallback: ConnectivityManager.NetworkCallback? = null // 网络回调实例

    /**
     * 启动监听
     *
     * @param context  应用上下文
     * @param callback 网络状态变化回调（WiFi 可用/不可用）
     */
    fun start(context: Context, callback: (available: Boolean) -> Unit) {
        if (networkCallback != null) return // 已启动，幂等
        this.callback = callback
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
                // WiFi 信号变化时再次确认可用性
                val hasWifi = networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                Log.d(TAG, "WiFi capabilities changed: wifi=$hasWifi, internet=$hasInternet")
                if (!hasWifi) {
                    callback(false)
                }
            }
        }

        connectivityManager?.registerNetworkCallback(request, networkCallback!!)

        // 初始状态通知
        val initialAvailable = isWifiConnected(context)
        callback(initialAvailable)
        Log.i(TAG, "NetworkMonitor started, initial=${initialAvailable}")
    }

    /**
     * 停止监听
     */
    fun stop(context: Context) {
        networkCallback?.let {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            try {
                cm?.unregisterNetworkCallback(it)
            } catch (_: Exception) {
                // 已注销或无网络权限
            }
        }
        networkCallback = null
        connectivityManager = null
        callback = null
        Log.i(TAG, "NetworkMonitor stopped")
    }

    /**
     * 检查当前是否有 WiFi 连接
     */
    private fun isWifiConnected(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val capabilities = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
    }
}
