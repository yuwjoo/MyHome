package com.yuwjoo.myhome.ui.webview2

import com.yuwjoo.myhome.config.AppConfig

/**
 * WebView 配置
 */
object WebViewConfig {
    const val LOCAL_RESOURCE_HOST = "local-web" // 本地资源拦截域名
    const val EXIT_INTERVAL_MS = 2000L // 双击退出间隔（毫秒）
    const val DEV_WEB_URL = AppConfig.DEV_WEB_URL // 开发环境 Web 地址
    const val RELEASE_WEB_URL = AppConfig.LOCAL_WEB_HOST // 生产环境 Web 地址
}
