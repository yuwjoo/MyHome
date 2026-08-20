package com.yuwjoo.myhome.module.peerudp.transport

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log
import com.yuwjoo.myhome.module.peerudp.SerialCoroutine
import kotlinx.coroutines.launch

/**
 * 网络变化监听器
 */
internal class NetworkMonitor(context: Context) {

    companion object {
        private const val TAG = "NetworkMonitor"
    }

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager // 连接管理器（构造时初始化，复用）
    private var isStarted = false // 是否已注册监听
    private var onNetworkChanged: ((available: Boolean) -> Unit)? = null // 网络可用性变化回调

    // 网络请求（固定监听 WiFi）
    private val request = NetworkRequest.Builder()
        .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
        .build()

    // 网络回调实例只创建一次，start/stop 仅注册/注销
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {

        override fun onAvailable(network: Network) {
            Log.d(TAG, "WiFi available")
            dispatch(true)
        }

        override fun onLost(network: Network) {
            Log.d(TAG, "WiFi lost")
            dispatch(false)
        }

        override fun onCapabilitiesChanged(
            network: Network,
            capabilities: NetworkCapabilities,
        ) {
            val hasWifi = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
            Log.d(TAG, "WiFi capabilities changed: hasWifi=$hasWifi")
            dispatch(hasWifi)
        }

        /**
         * 在串行协程中分发网络状态变化回调
         *
         * @param available 网络是否可用
         */
        private fun dispatch(available: Boolean) {
            SerialCoroutine.scope.launch {
                onNetworkChanged(available)
            }
        }
    }

    /**
     * 启动网络监听
     *
     * @param onNetworkChanged 网络可用性变化回调
     */
    fun start(onNetworkChanged: (available: Boolean) -> Unit) {
        if (isStarted) return
        this.onNetworkChanged = onNetworkChanged

        val cm = connectivityManager
        if (cm == null) {
            Log.e(TAG, "ConnectivityManager is null")
            return
        }

        cm.registerNetworkCallback(request, networkCallback)
        isStarted = true
        Log.i(TAG, "NetworkMonitor started")
    }

    /**
     * 停止网络监听，并清除回调
     */
    fun stop() {
        if (!isStarted) return
        try {
            connectivityManager?.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {
            // 已注销或无权限
        }
        isStarted = false
        onNetworkChanged = null
        Log.i(TAG, "NetworkMonitor stopped")
    }
}
