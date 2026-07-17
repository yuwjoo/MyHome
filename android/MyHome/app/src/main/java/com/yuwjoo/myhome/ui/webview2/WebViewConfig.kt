package com.yuwjoo.myhome.ui.webview2

import com.yuwjoo.myhome.config.AppConfig

/**
 * WebView 配置
 */
object WebViewConfig {
    const val LOCAL_RESOURCE_PROTOCOL = "https" // 本地资源请求协议
    const val LOCAL_RESOURCE_HOST = AppConfig.MANIFEST_KEY_MY_HOME_MOBILE // 本地资源请求域名
    const val DEV_WEB_URL = AppConfig.DEV_WEB_URL // 开发环境 Web 地址
    const val RELEASE_WEB_URL = "$LOCAL_RESOURCE_PROTOCOL://$LOCAL_RESOURCE_HOST" // 生产环境 Web 地址
    
    const val EXIT_INTERVAL_MS = 2000L // 返回按键退出间隔（毫秒）
}
