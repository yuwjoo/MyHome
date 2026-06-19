package com.yuwjoo.myhomeserver

import android.app.Application
import com.yuwjoo.myhomeserver.modules.foreground.LiveForegroundService
import com.yuwjoo.myhomeserver.modules.mqtt.MqttManager
import com.yuwjoo.myhomeserver.modules.oss.OssManager

/**
 * Application 入口
 *
 * 应用冷启动时完成全局初始化：
 * 1. 创建通知渠道（前台服务必需）
 * 2. 初始化 MQTT 单例并连接 broker
 * 3. 初始化 OSS 管理器
 */
class MyHomeServerApp : Application() {

    override fun onCreate() {
        super.onCreate()

        // 1. 创建通知渠道
        LiveForegroundService.createNotificationChannel(this)

        // 2. 初始化 MQTT 并连接
        MqttManager.init()
        MqttManager.getInstance().connect()

        // 3. 初始化 OSS 管理器（必须提供 ApplicationContext）
        OssManager.init(this)
    }
}
