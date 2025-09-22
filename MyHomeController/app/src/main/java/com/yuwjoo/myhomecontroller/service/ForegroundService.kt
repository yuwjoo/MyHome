package com.yuwjoo.myhomecontroller.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import com.yuwjoo.myhomecontroller.R
import com.yuwjoo.myhomecontroller.mqtt.MyHomeControllerMQTT

/**
 * 基础前台服务类，提供应用程序在后台运行的能力
 * 前台服务会在状态栏显示一个持续的通知，确保服务不容易被系统杀死
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
         * @param context 上下文对象，通常是Activity或Application
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
         * @param context 上下文对象，通常是Activity或Application
         */
        fun stopService(context: Context) {
            val intent = Intent(context, ForegroundService::class.java)
            context.stopService(intent)
        }
    }

    // MQTT管理类（使用单例实例）
    private lateinit var myHomeControllerMQTT: MyHomeControllerMQTT

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "服务创建")
        // 创建通知渠道（Android 8.0及以上版本需要）
        createNotificationChannel()
        // 初始化MQTT管理器
        initMyHomeControllerMQTT()
        // 创建并启动前台服务
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 这里可以实现服务的核心功能，例如：定时任务、数据同步、监控等
        Log.d(TAG, "服务启动")
        // 确保MQTT连接已建立
        if (!myHomeControllerMQTT.isConnected()) {
            Log.d(TAG, "尝试连接MQTT服务器...")
            myHomeControllerMQTT.connect()
        }
        // 返回START_STICKY以确保服务被系统杀死后能够重启
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        // 如果服务不提供绑定功能，返回null
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "服务销毁")
        // 断开MQTT连接
        myHomeControllerMQTT.disconnect()
    }

    /**
     * 初始化MyHomeControllerMQTT管理器
     */
    private fun initMyHomeControllerMQTT() {
        // 获取单例实例
        myHomeControllerMQTT = MyHomeControllerMQTT.getInstance()

        // 初始化MQTT客户端，传入Context
        myHomeControllerMQTT.init(this)
        // 连接MQTT服务器
        myHomeControllerMQTT.connect()
    }

    /**
     * 创建通知渠道
     * Android 8.0及以上版本需要通知渠道才能显示通知
     */
    private fun createNotificationChannel() {
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
    }

    /**
     * 创建前台服务的通知
     * 前台服务必须显示一个持续的通知
     */
    private fun createNotification(): Notification {
        // 创建自定义通知布局的RemoteViews
        val remoteViews = RemoteViews(packageName, R.layout.notification_air_conditioner)
        
        // 设置初始温度显示
        remoteViews.setTextViewText(R.id.temperature_text, "26")
        
        // 设置定时显示
        remoteViews.setTextViewText(R.id.timer_text, "00:00")
        
        // 设置模式显示
        remoteViews.setTextViewText(R.id.mode_text, "制冷")
        
        // 创建通知构建器
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher) // 使用应用程序图标
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true) // 设置为 ongoing，用户不能手动取消
            .setCustomContentView(remoteViews) // 设置自定义内容视图
            .setStyle(NotificationCompat.DecoratedCustomViewStyle()) // 使用装饰的自定义视图样式

        return notificationBuilder.build()
    }
}