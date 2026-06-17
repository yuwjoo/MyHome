#include "MqttManager.h"

// ============================================================
//  MqttManager 实现
//  基于 PubSubClient 库
// ============================================================

MqttManager::MqttManager(WiFiClient &wifiClient)
    : _wifiClient(wifiClient), _client(wifiClient) {
    // 设置 MQTT 服务器地址和端口
    _client.setServer(MQTT_BROKER, MQTT_PORT);
    // 设置内部缓冲区大小
    _client.setBufferSize(MQTT_BUFFER_SIZE);

    // 绑定消息回调（使用 static 函数适配 C 风格回调）
    _client.setCallback([this](char *topic, uint8_t *payload, unsigned int length) {
        this->handleMessage(topic, payload, length);
    });
}

bool MqttManager::connect() {
    if (_client.connected()) {
        return true;  // 已连接，无需重复连接
    }

    Serial.print("[MQTT] 正在连接 Broker: ");
    Serial.print(MQTT_BROKER);
    Serial.print(":");
    Serial.println(MQTT_PORT);

    // 设置遗嘱消息（设备离线时 Broker 自动发布）
    if (!_client.connect(
            MQTT_CLIENT_ID,
            MQTT_USERNAME,
            MQTT_PASSWORD,
            MQTT_WILL_TOPIC,
            1,                          // 遗嘱消息 QoS
            true,                       // 遗嘱消息 retained
            MQTT_WILL_PAYLOAD           // 遗嘱消息内容
        )) {
        Serial.print("[MQTT] 连接失败，状态码: ");
        Serial.println(_client.state());
        return false;
    }

    Serial.println("[MQTT] 连接成功！");

    // 发布在线状态（保留消息），覆盖上次离线时 Broker 遗留的遗嘱消息
    Serial.printf("[MQTT] 已发布在线状态 → %s: %s\n", MQTT_WILL_TOPIC, MQTT_ONLINE_PAYLOAD);
    _client.publish(MQTT_WILL_TOPIC, MQTT_ONLINE_PAYLOAD, true);

    return true;
}

void MqttManager::disconnect() {
    _client.disconnect();
}

bool MqttManager::isConnected() {
    return _client.connected();
}

bool MqttManager::subscribe(const char *topic) {
    if (!_client.connected()) {
        Serial.println("[MQTT] 未连接，无法订阅");
        return false;
    }
    if (_client.subscribe(topic)) {
        Serial.printf("[MQTT] 已订阅: %s\n", topic);
        return true;
    } else {
        Serial.printf("[MQTT] 订阅失败: %s\n", topic);
        return false;
    }
}

bool MqttManager::unsubscribe(const char *topic) {
    if (!_client.connected()) return false;
    if (_client.unsubscribe(topic)) {
        Serial.printf("[MQTT] 已取消订阅: %s\n", topic);
        return true;
    }
    return false;
}

bool MqttManager::publish(const char *topic, const char *payload, bool retained) {
    if (!_client.connected()) {
        Serial.println("[MQTT] 未连接，无法发布");
        return false;
    }
    if (_client.publish(topic, payload, retained)) {
        Serial.printf("[MQTT] 已发布 → %s: %s\n", topic, payload);
        return true;
    } else {
        Serial.printf("[MQTT] 发布失败 → %s\n", topic);
        return false;
    }
}

void MqttManager::setOnMessage(MqttMessageCallback callback) {
    _onMessage = callback;
}

void MqttManager::loop() {
    // 如果断线则尝试重连
    if (!_client.connected()) {
        static unsigned long lastRetry = 0;
        unsigned long now = millis();
        if (now - lastRetry >= MQTT_RETRY_INTERVAL) {
            lastRetry = now;
            Serial.println("[MQTT] 连接断开，尝试重连...");
            connect();
            // 重连成功后重新订阅之前的主题
            // （PubSubClient 不会自动恢复订阅）
        }
    }

    // 处理 MQTT 消息收发
    _client.loop();
}

// ── 私有方法 ──

void MqttManager::handleMessage(char *topic, uint8_t *payload, unsigned int length) {
    // 将收到的消息转发给外部注册的回调
    if (_onMessage != nullptr) {
        _onMessage(topic, payload, length);
    }
}
