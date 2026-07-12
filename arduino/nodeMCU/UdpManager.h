#ifndef UDP_MANAGER_H
#define UDP_MANAGER_H

#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include "Config.h"

/**
 * UdpManager — UDP 组播通信与主题管理模块
 */
class UdpManager {
public:
    /**
     * UDP 消息回调函数类型
     *
     * @param topic   主题
     * @param payload 消息体
     * @param length  消息长度
     */
    typedef void (*MessageCallback)(const char *topic, const uint8_t *payload, unsigned int length);
    
    /**
     * 加入组播组并广播本机设备信息
     *
     * 必须在 WiFi 已连接后调用，重复调用不会重复加入。
     *
     * @return true=加入成功或已加入
     */
    bool connect();

    /**
     * 离开组播组
     */
    void disconnect();

    /**
     * 检查是否已加入组播
     *
     * @return true=已加入组播组
     */
    bool isConnected();

    /**
     * 发布消息到组播组
     *
     * 将 topic 与 payload 封装为 JSON 后组播发送。
     *
     * @param topic   发布主题
     * @param payload 消息体字符串
     * @return true=发布成功，false=未连接组播无法发布
     */
    bool publish(const char *topic, const char *payload);

    /**
     * 注册消息回调
     *
     * @param callback 回调函数指针，传 nullptr 可清除
     */
    void setOnMessage(MessageCallback callback);

    /**
     * 主循环 tick
     *
     * 必须在 loop() 中周期性调用，用于接收并处理 UDP 消息。
     */
    void loop();

private:
    WiFiUDP _wifiUdp;                           // WiFiUDP 实例
    bool _isConnected = false;                // 是否已加入组播
    MessageCallback _onMessageCallback = nullptr; // 消息回调

    /**
     * 处理一条已解析的 UDP 消息
     *
     * 逻辑路由：系统主题内部处理，其余消息转发给回调。
     *
     * @param payload 原始 JSON 消息
     * @param fromIp  发送方 IP 地址
     */
    void _handleMessage(const char *payload, const String &fromIp);

    /**
     * 构建并发送 UDP 消息
     *
     * 将 topic 与 payload 封装为 JSON 后通过 UDP 发送。
     *
     * @param topic    主题
     * @param payload  消息体，为空时不写入 payload 字段
     * @param targetIp 目标 IP，为空时组播发送；非空时单播到指定 IP
     */
    void _sendMessage(const String &topic, const String &payload, const String &targetIp = "");

    /**
     * 构建本机设备信息 JSON
     *
     * 包含设备名称、在线状态及支持的主题列表，用于设备发现。
     *
     * @return 设备信息 JSON 字符串
     */
    String _deviceInfoToJson();

};

#endif
