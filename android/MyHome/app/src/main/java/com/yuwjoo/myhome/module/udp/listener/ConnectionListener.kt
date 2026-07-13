package com.yuwjoo.myhome.module.udp.listener

/**
 * 连接状态监听器
 */
fun interface ConnectionListener {
    /**
     * 连接状态改变时回调
     *
     * @param connected 是否已连接
     */
    fun onConnectionChanged(connected: Boolean)
}
