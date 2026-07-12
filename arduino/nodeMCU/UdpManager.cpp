#include "UdpManager.h"
#include <ArduinoJson.h>
#include "Log.h"

bool UdpManager::connect() {
    if (_isConnected) return true;

    IPAddress multicastAddr;
    multicastAddr.fromString(UDP_MULTICAST_ADDR);
    _wifiUdp.beginMulticast(
        WiFi.localIP(),
        multicastAddr,
        UDP_LISTEN_PORT
    );
    _isConnected = true;
    LOG_PRINTLN("[UDP] 组播加入成功");

    _sendMessage(UDP_TOPIC_LOCAL_DEVICE, _deviceInfoToJson());

    return true;
}

void UdpManager::disconnect() {
    if (!_isConnected) return;
    _wifiUdp.stop();
    _isConnected = false;
    LOG_PRINTLN("[UDP] 已离开组播");
}

bool UdpManager::isConnected() {
    return _isConnected;
}

bool UdpManager::publish(const char *topic, const char *payload) {
    if (!_isConnected) {
        LOG_PRINTLN("[UDP] 未连接组播，无法发布");
        return false;
    }
    _sendMessage(topic, payload);
    LOG_PRINTF("[UDP] 已发布 → %s: %s\n", topic, payload);
    return true;
}

void UdpManager::setOnMessage(MessageCallback callback) {
    _onMessageCallback = callback;
}

void UdpManager::loop() {
    if (WiFi.status() != WL_CONNECTED) {
        if (_isConnected) disconnect();
        return;
    }
    if (!_isConnected) {
        connect();
    }
    char buffer[UDP_BUFFER_SIZE];
    while (_wifiUdp.parsePacket() > 0) {
        int len = _wifiUdp.read(buffer, sizeof(buffer) - 1);
        if (len <= 0) continue;
        buffer[len] = '\0';
        _handleMessage(buffer, _wifiUdp.remoteIP().toString());
    }
}

void UdpManager::_handleMessage(const char *payload, const String &fromIp) {
    LOG_PRINTLN("[UDP] 接收到消息");
    StaticJsonDocument<UDP_BUFFER_SIZE> doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (err) return;
    if (!doc.containsKey("topic")) return;
    String topic = doc["topic"].as<String>();
    String msgPayload;
    if (doc.containsKey("payload")) {
        msgPayload = doc["payload"].as<String>();
    }
    LOG_PRINTF("[UDP] 解析的消息 → %s: %s\n", topic, msgPayload);

    // 扫描设备主题消息
    if (topic == UDP_TOPIC_SCAN_DEVICES) {
        _sendMessage(UDP_TOPIC_SCAN_DEVICES, _deviceInfoToJson(), fromIp);
        return;
    }

    if (_onMessageCallback != nullptr) {
        _onMessageCallback(topic.c_str(), (const uint8_t *)msgPayload.c_str(), msgPayload.length());
    }
}

String UdpManager::_deviceInfoToJson() {
    StaticJsonDocument<UDP_BUFFER_SIZE> doc;
    doc["deviceName"] = UDP_DEVICE_NAME;
    doc["online"] = true;
    JsonArray arr = doc.createNestedArray("topics");
    for (size_t i = 0; i < UDP_SUBSCRIBED_TOPICS_COUNT; i++) {
        arr.add(UDP_SUBSCRIBED_TOPICS[i]);
    }
    String json;
    serializeJson(doc, json);
    return json;
}

void UdpManager::_sendMessage(const String &topic, const String &payload, const String &targetIp) {
    if (!_isConnected) {
        LOG_PRINTLN("[UDP] 未连接组播，无法发送");
        return;
    }

    StaticJsonDocument<UDP_BUFFER_SIZE> doc;
    doc["topic"] = topic;
    if (payload.length() > 0) {
        doc["payload"] = payload;
    }
    String json;
    serializeJson(doc, json);

    IPAddress addr;
    if (targetIp.length() > 0) {
        addr.fromString(targetIp);
    } else {
        addr.fromString(UDP_MULTICAST_ADDR);
    }

    _wifiUdp.beginPacket(addr, UDP_SEND_PORT);
    _wifiUdp.print(json);
    if (!_wifiUdp.endPacket()) {
        LOG_PRINTLN("[UDP] 发送失败");
        disconnect();
    }
}


