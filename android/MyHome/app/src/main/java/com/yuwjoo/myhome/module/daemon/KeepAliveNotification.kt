package com.yuwjoo.myhome.module.daemon

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat

/**
 * 保活通知管理
 */
object KeepAliveNotification {

    const val CHANNEL_ID = "daemon" // 通知渠道 ID
    const val NOTIFICATION_ID = 1 // 前台通知 ID

    /**
     * 创建通知渠道
     *
     * Android 8.0+ 必须先创建渠道才能发送通知
     *
     * @param context 上下文
     */
    fun createChannel(context: Context) {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "服务运行中",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "用于保持应用在后台运行"
        }

        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    /**
     * 构建前台通知
     *
     * @param context 上下文
     * @return 前台通知实例
     */
    fun build(context: Context): Notification {
        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_info_details)
            .setContentTitle("MyHome")
            .setContentText("服务运行中")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
