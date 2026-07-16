package com.yuwjoo.myhome.module.daemon

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * 保活前台服务
 *
 * 通过前台通知提升进程优先级，降低被系统杀死的概率
 */
class KeepAliveService : Service() {

    /**
     * 服务创建时初始化通知并启动前台服务
     */
    override fun onCreate() {
        super.onCreate()
        KeepAliveNotification.createChannel(this)
        startForeground(KeepAliveNotification.NOTIFICATION_ID, KeepAliveNotification.build(this))
    }

    /**
     * 每次 startService 调用时触发
     *
     * @return START_STICKY 保证服务被杀死后自动重启
     */
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    /**
     * 此服务不绑定组件，返回 null
     */
    override fun onBind(intent: Intent?): IBinder? = null

    /**
     * 服务销毁时移除通知
     */
    override fun onDestroy() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
}
