package com.yuwjoo.myhome.module.udp.client.transport

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * 网络监听：通过 ConnectivityManager.NetworkCallback 监听 WiFi 连接状态，内置防抖
 */
internal class NetworkMonitor(private val callback: (available: Boolean) -> Unit) {

    companion object {
        private const val TAG = "NetworkMonitor"
        private const val DEBOUNCE_MS = 1500L // 防抖间隔（毫秒）
    }

    private var connectivityManager: ConnectivityManager? = null // 网络连接管理器
    @Volatile private var networkCallback: ConnectivityManager.NetworkCallback? = null // 网络回调实例

    // 防抖
    private val scope = CoroutineScope(Dispatchers.Main) // 防抖协程作用域
    private var debounceJob: Job? = null // 当前防抖 Job
    private var pendingState: Boolean? = null // 最近一次待通知的状态

    /**
     * 启动监听
     *
     * @param context 应用上下文
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
                debounceNotify(true)
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "WiFi lost")
                debounceNotify(false)
            }

            override fun onCapabilitiesChanged(
                network: Network,
                networkCapabilities: NetworkCapabilities,
            ) {
                val hasWifi = networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                Log.d(TAG, "WiFi capabilities changed: wifi=$hasWifi, internet=$hasInternet")
                debounceNotify(hasWifi)
            }
        }

        connectivityManager?.registerNetworkCallback(request, networkCallback!!)

        // 初始状态通知
        val initialAvailable = isWifiConnected(context)
        callback(initialAvailable)
        Log.i(TAG, "NetworkMonitor started, initial=${initialAvailable}")
    }

    /**
     * 停止监听，注销网络回调
     *
     * @param context 应用上下文
     */
    fun stop() {
        if (networkCallback == null) return
        debounceJob?.cancel()
        debounceJob = null

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

    /**
     * 防抖通知：挂起 [DEBOUNCE_MS] 后若未再收到新变化，则触发回调
     *
     * @param available 网络是否可用
     */
    private fun debounceNotify(available: Boolean) {
        pendingState = available
        debounceJob?.cancel()
        debounceJob = scope.launch {
            delay(DEBOUNCE_MS)
            pendingState?.let { state ->
                callback(state)
                Log.d(TAG, "Debounced notify: available=$state")
            }
        }
    }

    /**
     * 检查当前是否有 WiFi 连接
     *
     * @param context 应用上下文
     * @return 是否有 WiFi 连接
     */
    private fun isWifiConnected(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val capabilities = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
    }
}
