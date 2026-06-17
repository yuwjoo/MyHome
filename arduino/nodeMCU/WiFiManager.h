#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <ESP8266WiFi.h>
#include "Config.h"

/**
 * WiFiManager — WiFi 连接管理模块
 *
 * 职责：
 * - 连接到指定 WiFi 网络
 * - 自动重连（断开后自动恢复）
 * - 提供连接状态查询
 *
 * 使用方式：
 *   WiFiManager wifi;
 *   wifi.connect();
 *   if (wifi.isConnected()) { ... }
 *   wifi.loop();              // 在主循环中调用以维持连接
 */
class WiFiManager {
public:
    /**
     * 连接 WiFi
     * 阻塞等待直到连接成功或超时。
     * @return true=连接成功, false=连接失败
     */
    bool connect();

    /**
     * 检查 WiFi 是否已连接
     * @return true=已连接
     */
    bool isConnected();

    /**
     * 获取本机 IP 地址
     * @return IP 地址字符串
     */
    String getIP();

    /**
     * 主循环调用，维持连接状态
     * 断开后自动尝试重连。
     */
    void loop();

private:
    /** 连接 WiFi 并等待结果（阻塞） */
    bool connectBlocking();
};

#endif  // WIFI_MANAGER_H
