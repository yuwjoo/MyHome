package com.yuwjoo.myhome.module.udp

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.util.Log

/**
 * 网络状态监听器
 */
class NetworkMonitor {

    companion object {
        private const val TAG = "NetworkMonitor"
    }

    private var connectivityManager: ConnectivityManager? = null
    private var callback: NetworkCallbackImpl? = null
    private var listener: ((Boolean) -> Unit)? = null

    val isAvailable: Boolean
        get() {
            val nw = connectivityManager?.activeNetwork ?: return false
            val caps = connectivityManager?.getNetworkCapabilities(nw) ?: return false
            return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        }

    /**
     * 开始监听
     *
     * @param context  用于获取系统服务
     * @param listener 网络状态回调，true 表示网络可用
     */
    fun start(context: Context, listener: (Boolean) -> Unit) {
        if (callback != null) stop()
        this.listener = listener
        connectivityManager =
            context.applicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        callback = NetworkCallbackImpl()
        connectivityManager?.registerDefaultNetworkCallback(callback!!)
        Log.d(TAG, "start monitoring")
    }

    /**
     * 停止监听
     */
    fun stop() {
        callback?.let { connectivityManager?.unregisterNetworkCallback(it) }
        callback = null
        connectivityManager = null
        listener = null
        Log.d(TAG, "stop monitoring")
    }

    private inner class NetworkCallbackImpl : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            Log.d(TAG, "network available")
            listener?.invoke(true)
        }

        override fun onLost(network: Network) {
            Log.d(TAG, "network lost")
            listener?.invoke(false)
        }

        override fun onCapabilitiesChanged(
            network: Network,
            networkCapabilities: NetworkCapabilities,
        ) {
            val hasInternet =
                networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            Log.d(TAG, "capabilities changed, hasInternet=$hasInternet")
            listener?.invoke(hasInternet)
        }
    }
}
