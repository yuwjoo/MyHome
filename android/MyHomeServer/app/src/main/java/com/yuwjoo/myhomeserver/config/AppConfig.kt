package com.yuwjoo.myhomeserver.config

/**
 * 应用级全局配置
 *
 * 集中管理各模块共用的常量：通知渠道、后台服务、API 基础路径等。
 */
object AppConfig {
    // ── 通知渠道 ──
    const val NOTIFICATION_CHANNEL_ID = "myhome_live_stream"
    const val NOTIFICATION_CHANNEL_NAME = "直播推流"
    const val NOTIFICATION_CHANNEL_DESC = "直播推流服务运行中"
    const val NOTIFICATION_FOREGROUND_ID = 10001

    // ── API ──
    /** 后端服务地址，OSS 上传签名等接口的基础路径 */
    const val API_BASE_URL = "http://47.115.161.79:3000/api"

    // ── 其他 ──
    /** OkHttp 通用超时（秒） */
    const val HTTP_TIMEOUT = 30L
}
