package com.yuwjoo.myirrc.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.yuwjoo.myirrc.R
import com.yuwjoo.myirrc.common.telecontrol.MQTTTelecontrolServer
import com.yuwjoo.myirrc.common.telecontrol.SocketTelecontrolServer
import com.yuwjoo.myirrc.common.telecontrol.UDPTelecontrolServer

/**
 * 前台服务类
 */
class ForegroundService : Service() {

    companion object {
        private const val TAG = "ForegroundService"
        private const val CHANNEL_ID = "foreground_service_channel"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_NAME = "前台服务"
        private const val CHANNEL_DESCRIPTION = "用于保持应用程序在后台运行的服务"

        /**
         * 启动前台服务的静态方法
         * @param context 上下文对象
         */
        fun startService(context: Context) {
            val intent = Intent(context, ForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * 停止前台服务的静态方法
         * @param context 上下文对象
         */
        fun stopService(context: Context) {
            val intent = Intent(context, ForegroundService::class.java)
            context.stopService(intent)
        }
    }

    /**
     * 服务创建
     */
    override fun onCreate() {
        super.onCreate()
        MQTTTelecontrolServer.getInstance().connect() // 连接MQTT遥控服务
        SocketTelecontrolServer.getInstance().startServer() // 开启Socket遥控服务
        UDPTelecontrolServer.startReceive() // 开启upd遥控广播接收
        startForeground(NOTIFICATION_ID, createNotification()) // 创建并启动前台服务
    }

    /**
     * 服务启动
     */
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 返回START_STICKY以确保服务被系统杀死后能够重启
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        // 如果服务不提供绑定功能，返回null
        return null
    }

    /**
     * 服务销毁
     */
    override fun onDestroy() {
        super.onDestroy()
        MQTTTelecontrolServer.getInstance().disconnect() // 断开MQTT连接
        SocketTelecontrolServer.getInstance().stopServer() // 停止Socket服务
        UDPTelecontrolServer.closeReceive() // 关闭upd遥控广播接收
    }

    /**
     * 创建前台服务通知
     */
    private fun createNotification(): Notification {
        // Android 8.0及以上版本创建渠道
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = CHANNEL_DESCRIPTION
            }

            // 向系统注册通知渠道
            val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
        // 创建通知构建器
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher) // 使用应用程序图标
            .setContentTitle("智能家居遥控")
            .setContentText("前台服务和Socket服务运行中")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true) // 设置为 ongoing，用户不能手动取消
            .setStyle(NotificationCompat.DecoratedCustomViewStyle()) // 使用装饰的自定义视图样式

        return notificationBuilder.build()
    }
}