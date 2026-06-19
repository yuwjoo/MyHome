package com.yuwjoo.myhomeserver.modules.foreground

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.yuwjoo.myhomeserver.MainActivity
import com.yuwjoo.myhomeserver.config.AppConfig

/**
 * 前台服务
 *
 * 以常驻通知的形式保持应用进程存活，从而维持 MQTT 长连接不被系统杀死。
 * 在 Android 8+ 的后台限制下，前台服务是保持长连接的关键手段。
 *
 * ### 设计要点
 * - **即刻前台化**：onCreate 中立即调用 startForeground（确保 5 秒内完成）
 * - **WakeLock**：防止 CPU 休眠导致 MQTT 断连
 * - **通知渠道**：在 Application 中提前创建，兼容 Android 8+
 * - **通知内容**：实时反映当前直播推流状态
 *
 * ### 使用方式
 * ```kotlin
 * // 启动
 * val intent = Intent(context, LiveForegroundService::class.java)
 * ContextCompat.startForegroundService(context, intent)
 *
 * // 更新通知文字
 * LiveForegroundService.updateStatus(context, "推流中 — 卧室摄像头")
 *
 * // 关闭
 * context.stopService(Intent(context, LiveForegroundService::class.java))
 * ```
 */
class LiveForegroundService : Service() {

    companion object {
        /** 广播 action：更新通知状态文字 */
        const val ACTION_UPDATE_STATUS = "com.yuwjoo.myhomeserver.UPDATE_LIVE_STATUS"
        const val EXTRA_STATUS_TEXT = "status_text"

        /**
         * 创建通知渠道（Application.onCreate 中调用一次即可）
         */
        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    AppConfig.NOTIFICATION_CHANNEL_ID,
                    AppConfig.NOTIFICATION_CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_LOW,
                ).apply {
                    description = AppConfig.NOTIFICATION_CHANNEL_DESC
                    setShowBadge(false)
                }
                val manager = context.getSystemService(NotificationManager::class.java)
                manager.createNotificationChannel(channel)
            }
        }

        /**
         * 更新前台服务通知的状态文字
         */
        fun updateStatus(context: Context, statusText: String) {
            val intent = Intent(context, LiveForegroundService::class.java).apply {
                action = ACTION_UPDATE_STATUS
                putExtra(EXTRA_STATUS_TEXT, statusText)
            }
            context.startService(intent)
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        // 必须在创建后 5 秒内调用 startForeground，否则系统会 kill 服务
        val notification = buildNotification("直播推流服务运行中")
        startForeground(AppConfig.NOTIFICATION_FOREGROUND_ID, notification)
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_UPDATE_STATUS -> {
                val statusText = intent.getStringExtra(EXTRA_STATUS_TEXT)
                    ?: "直播推流服务运行中"
                val notification = buildNotification(statusText)
                startForeground(AppConfig.NOTIFICATION_FOREGROUND_ID, notification)
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        releaseWakeLock()
        super.onDestroy()
    }

    private fun buildNotification(statusText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, AppConfig.NOTIFICATION_CHANNEL_ID)
            .setContentTitle("MyHomeServer")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "MyHomeServer:LiveStreamWakeLock",
            )
            wakeLock?.acquire(30 * 60 * 1000L) // 最长 30 分钟
        } catch (_: Exception) {}
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
        } catch (_: Exception) {}
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // App 从多任务列表滑掉时仍然保持运行（除非用户手动停止）
        super.onTaskRemoved(rootIntent)
    }
}
