#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <vector>
#include "Config.h"

/** MQTT 消息回调函数类型：topic=主题, payload=消息体, length=消息长度 */
typedef void (*MqttMessageCallback)(const char *topic, const uint8_t *payload, unsigned int length);

/**
 * MqttManager — MQTT 连接与消息管理模块
 *
 * 职责：
 * - 连接 MQTT Broker
 * - 订阅 / 取消订阅 Topic
 * - 发布消息
 * - 接收消息并分发给注册的回调函数
 * - 断线自动重连
 *
 * 使用方式：
 *   WiFiClient wifiClient;
 *   MqttManager mqtt(wifiClient);
 *   mqtt.setOnMessage(callback);
 *   mqtt.connect();
 *   mqtt.subscribe("YHome/cmd/bedroomAC");
 *   mqtt.publish("YHome/data/tempHumidSensor", "{\"temperature\":26}");
 *   mqtt.loop();  // 在主循环中调用
 */
class MqttManager {
public:
    /**
     * 构造函数
     * @param wifiClient WiFi 客户端实例（需在外部创建并传入）
     */
    explicit MqttManager(WiFiClient &wifiClient);

    /**
     * 连接 MQTT Broker
     * 必须在 WiFi 已连接的情况下调用。
     * @return true=连接成功
     */
    bool connect();

    /**
     * 断开 MQTT 连接
     */
    void disconnect();

    /**
     * 检查 MQTT 是否已连接
     * @return true=已连接
     */
    bool isConnected();

    /**
     * 订阅主题
     * @param topic 订阅的主题
     * @param qos   服务质量等级（0 或 1）
     * @return true=订阅成功
     */
    bool subscribe(const char *topic, uint8_t qos = 0);

    /**
     * 取消订阅主题
     * @param topic 要取消的主题
     * @return true=取消成功
     */
    bool unsubscribe(const char *topic);

    /**
     * 发布消息
     * @param topic   发布主题
     * @param payload 消息体（字符串）
     * @param retained 是否保留消息
     * @param qos     服务质量等级（0 或 1）
     * @return true=发布成功
     */
    bool publish(const char *topic, const char *payload, uint8_t qos = 0, bool retained = false);

    /**
     * 注册消息回调
     * @param callback 回调函数指针
     */
    void setOnMessage(MqttMessageCallback callback);

    /**
     * 主循环调用
     * 维持 MQTT 连接，断线自动重连，处理收发的消息。
     */
    void loop();

private:
    WiFiClient &_wifiClient;       // WiFi 客户端引用
    PubSubClient _client;           // PubSubClient 实例
    MqttMessageCallback _onMessage = nullptr;  // 消息回调
    struct TopicInfo { String topic; uint8_t qos; }; // 主题与 QoS 信息
    std::vector<TopicInfo> _topics;  // 已订阅主题列表，重连后补订阅

    static const int MQTT_BUFFER_SIZE = 512;   // MQTT 缓冲区大小

    /** 处理收到的 MQTT 消息，转发给外部回调 */
    void handleMessage(char *topic, uint8_t *payload, unsigned int length);
};

#endif  // MQTT_MANAGER_H
