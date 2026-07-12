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
 *                             → IRTcl112Ac.send → 红外发射（TCL112AC 协议）
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
#include "Log.h"
#include "MessageDto.h"
#include "WiFiManager.h"
#include "MqttManager.h"
// #include "UdpManager.h"
#include "DhtSensor.h"
#include "BedroomAC.h"

// ============================================================
//  模块实例
// ============================================================
WiFiClient wifiClient;
WiFiManager wifiManager;
MqttManager mqttManager(wifiClient);
// UdpManager udpManager;
DhtSensor dhtSensor;
BedroomAC bedroomAC;

// ============================================================
//  程序入口
// ============================================================

void setup() {
    LOG_BEGIN(115200);
    LOG_PRINTLN();
    LOG_PRINTLN("=========================================");
    LOG_PRINTLN("  智能家居 ESP8266 节点启动");
    LOG_PRINTF("  Client ID: %s\n", MQTT_CLIENT_ID);
    LOG_PRINTLN("=========================================");

    // ── 1. 连接 WiFi ──
    wifiManager.connect();

    // ── 2. 初始化 UDP ──
    // udpManager.setOnMessage(onMqttMessage);
    // udpManager.connect();

    // ── 3. 初始化 MQTT ──
    mqttManager.setOnMessage(onMqttMessage);
    mqttManager.connect();
    mqttManager.subscribe(TOPIC_RC_BEDROOM_AC, 1);

    // ── 3. 初始化各模块 ──
    dhtSensor.begin();
    bedroomAC.begin();

    // ── 4. 注册 AC 状态变更回调 ──
    // 每次空调操作后，自动将状态 JSON 通过 MQTT 保留消息上报
    bedroomAC.setOnStateChanged([](const String &stateJson) {
        mqttManager.publish(TOPIC_DEVICE_BEDROOM_AC, stateJson.c_str(), 1, true);
        LOG_PRINTF("[MQTT] AC 状态已上报(保留): %s\n", stateJson.c_str());
    });

    LOG_PRINTLN("[系统] 初始化完成");
}

void loop() {
    wifiManager.loop();
    // udpManager.loop();
    mqttManager.loop();

    // ── DHT11 定时上报（保留消息）──
    if (dhtSensor.shouldReport() && dhtSensor.read()) {
        // 通过消息结构组装数据，字段一目了然
        TempHumidMessage msg;
        msg.temperature = dhtSensor.getTemperature();
        msg.humidity    = dhtSensor.getHumidity();

        String json = msg.toJson();
        mqttManager.publish(TOPIC_SENSOR_TEMP_HUMID, json.c_str(), 1, true);
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
 *   {"action":"setOnTimer","params":{"minutes":60}}
 *   {"action":"cancelOffTimer"}
 *
 * 反序列化后路由到 BedroomAC 模块处理。
 */
void onMqttMessage(const char *topic, const uint8_t *payload, unsigned int length) {
    if (strcmp(topic, TOPIC_RC_BEDROOM_AC) != 0) return;

    // 一步反序列化，直接得到结构化数据
    RemoteCommand cmd = RemoteCommand::fromPayload(payload, length);

    if (cmd.action.length() == 0) {
        LOG_PRINTLN("[MQTT] 消息解析失败或缺少 action 字段，忽略");
        return;
    }

    LOG_PRINTF("[MQTT] 收到指令: %s", cmd.action.c_str());
    if (cmd.params.length() > 0) {
        LOG_PRINTF("，参数: %s", cmd.params.c_str());
    }
    LOG_PRINTLN();

    // 路由到空调遥控器模块
    bedroomAC.handleAction(cmd.action, cmd.params);
}
