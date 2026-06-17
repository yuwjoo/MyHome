/**
 * nodeMCU.ino — 智能家居 ESP8266 节点主程序
 *
 * 硬件：
 * - ESP8266 NodeMCU
 * - DHT11 温湿度传感器（D4 引脚）
 * - 红外发射管（D3 引脚）
 *
 * 功能：
 * 1. WiFi 联网
 * 2. MQTT 连接（与 Android App 共用同一 Broker）
 * 3. 定时读取 DHT11 并通过 MQTT 上报温湿度（保留消息）
 * 4. 监听 MQTT 遥控指令，通过 BedroomAC 模块发送红外控制空调
 *
 * 模块关系：
 *   MQTT 消息 → onMqttMessage → RemoteCommand.fromPayload → BedroomAC.handleAction
 *                             → IrTransmitter.sendRaw → 红外发射
 *                             → ACStateMessage.toJson → MqttManager.publish(retained) → Broker
 *   DhtSensor → TempHumidMessage.toJson → MqttManager.publish(retained) → Broker
 *
 * 依赖库（通过 Arduino 库管理器安装）：
 * - PubSubClient by Nick O'Leary
 * - SimpleDHT by winlin
 * - IRremoteESP8266 by David Conran
 * - ArduinoJson by Benoit Blanchon
 *
 * 配置：所有可配置参数在 Config.h 中集中管理。
 */

// ============================================================
//  引入模块
// ============================================================
#include "Config.h"
#include "MessageDto.h"
#include "WiFiManager.h"
#include "MqttManager.h"
#include "DhtSensor.h"
#include "IrTransmitter.h"
#include "BedroomAC.h"

// ============================================================
//  模块实例
// ============================================================
WiFiClient wifiClient;
WiFiManager wifiManager;
MqttManager mqttManager(wifiClient);
DhtSensor dhtSensor;
IrTransmitter irTransmitter;
BedroomAC bedroomAC(irTransmitter);

// ============================================================
//  程序入口
// ============================================================

void setup() {
    Serial.begin(115200);
    Serial.println();
    Serial.println("=========================================");
    Serial.println("  智能家居 ESP8266 节点启动");
    Serial.printf("  Client ID: %s\n", MQTT_CLIENT_ID);
    Serial.println("=========================================");

    // ── 1. 连接 WiFi ──
    wifiManager.connect();

    // ── 2. 初始化 MQTT ──
    mqttManager.setOnMessage(onMqttMessage);
    mqttManager.connect();
    mqttManager.subscribe(TOPIC_RC_BEDROOM_AC);

    // ── 3. 初始化各模块 ──
    dhtSensor.begin();
    irTransmitter.begin();
    bedroomAC.begin();

    // ── 4. 注册 AC 状态变更回调 ──
    // 每次空调操作后，自动将状态 JSON 通过 MQTT 保留消息上报
    bedroomAC.setOnStateChanged([](const String &stateJson) {
        mqttManager.publish(TOPIC_DEVICE_BEDROOM_AC, stateJson.c_str(), true);
        Serial.printf("[MQTT] AC 状态已上报(保留): %s\n", stateJson.c_str());
    });

    Serial.println("[系统] 初始化完成");
}

void loop() {
    wifiManager.loop();
    mqttManager.loop();

    // ── DHT11 定时上报（保留消息）──
    if (dhtSensor.shouldReport() && dhtSensor.read()) {
        // 通过消息结构组装数据，字段一目了然
        TempHumidMessage msg;
        msg.temperature = dhtSensor.getTemperature();
        msg.humidity    = dhtSensor.getHumidity();

        String json = msg.toJson();
        mqttManager.publish(TOPIC_SENSOR_TEMP_HUMID, json.c_str(), true);
    }

    delay(LOOP_DELAY);
}

// ============================================================
//  MQTT 消息回调
// ============================================================

/**
 * 收到 MQTT 消息时的处理入口
 *
 * 消息格式由 RemoteCommand 结构定义：
 *   {"action":"togglePower"}
 *   {"action":"setTiming","params":{"minutes":60}}
 *
 * 反序列化后路由到 BedroomAC 模块处理。
 */
void onMqttMessage(const char *topic, const uint8_t *payload, unsigned int length) {
    // 一步反序列化，直接得到结构化数据
    RemoteCommand cmd = RemoteCommand::fromPayload(payload, length);

    if (cmd.action.length() == 0) {
        Serial.println("[MQTT] 消息解析失败或缺少 action 字段，忽略");
        return;
    }

    Serial.printf("[MQTT] 收到指令: %s", cmd.action.c_str());
    if (cmd.params.length() > 0) {
        Serial.printf("，参数: %s", cmd.params.c_str());
    }
    Serial.println();

    // 路由到空调遥控器模块
    if (!bedroomAC.handleAction(cmd.action, cmd.params)) {
        Serial.printf("[控制] 指令 '%s' 的红外编码未配置，请先在 BedroomAC.cpp 中添加\n",
                      cmd.action.c_str());
    }
}
