#include "WiFiManager.h"
#include "Log.h"

// ============================================================
//  WiFiManager 实现
//  基于 ESP8266WiFi 库
// ============================================================

bool WiFiManager::connect() {
    return connectBlocking();
}

bool WiFiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

String WiFiManager::getIP() {
    return WiFi.localIP().toString();
}

void WiFiManager::loop() {
    // ESP8266 的 WiFi 库会自动维持连接（自动重连由 SDK 处理）
    // 这里仅作为预留接口，以便后续扩展（如状态监控、LED 指示等）
}

// ── 私有方法 ──

bool WiFiManager::connectBlocking() {
    LOG_PRINT("[WiFi] 正在连接: ");
    LOG_PRINTLN(WIFI_SSID);

    // 设置为 STA 模式（客户端模式）
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    // 阻塞等待连接成功
    int retryCount = 0;
    while (WiFi.status() != WL_CONNECTED) {
        delay(WIFI_RETRY_INTERVAL);
        LOG_PRINT(".");
        retryCount++;

        // 每 20 次重试打印一次状态
        if (retryCount % 40 == 0) {
            LOG_PRINTF("\n[WiFi] 仍在连接中... (已重试 %d 次)\n", retryCount);
        }
    }

    LOG_PRINTLN();
    LOG_PRINT("[WiFi] 连接成功！IP: ");
    LOG_PRINTLN(WiFi.localIP());
    return true;
}
