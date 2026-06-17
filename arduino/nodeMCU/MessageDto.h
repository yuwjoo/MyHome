#ifndef MESSAGE_DTO_H
#define MESSAGE_DTO_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "Config.h"

// ============================================================
//  MessageDto — 消息结构定义（类似 Java data class）
//
//  职责：
//  - 定义所有 MQTT 消息的结构（字段名、类型）
//  - 封装序列化 / 反序列化逻辑
//  - 一处定义，全局复用，修改时只需改这里
//
//  依赖：ArduinoJson by Benoit Blanchon
//  安装：Arduino 库管理器搜索 "ArduinoJson"
// ============================================================

// ──────────────────────────────────
//  TempHumidMessage
//  DHT11 温湿度上报消息
//  JSON 格式：{"temperature":26.0,"humidity":58.0}
// ──────────────────────────────────
struct TempHumidMessage {
    float temperature;
    float humidity;

    /** 序列化为 JSON 字符串 */
    String toJson() const {
        StaticJsonDocument<JSON_DOC_SIZE_TEMP_HUMID> doc;
        doc["temperature"] = temperature;
        doc["humidity"]    = humidity;
        String json;
        serializeJson(doc, json);
        return json;
    }
};

// ──────────────────────────────────
//  RemoteCommand
//  遥控指令消息（MQTT 接收）
//  JSON 格式：{"action":"togglePower","params":{"minutes":60}}
// ──────────────────────────────────
struct RemoteCommand {
    String action;  // 指令名称
    String params;  // 参数字符串（JSON），无参数时为 ""

    /**
     * 从 MQTT payload 反序列化
     * @param payload 消息体原始字节
     * @param length  消息体字节长度
     * @return RemoteCommand 实例，解析失败返回空 action
     */
    static RemoteCommand fromPayload(const uint8_t* payload, size_t length) {
        StaticJsonDocument<JSON_DOC_SIZE_RC> doc;
        DeserializationError err = deserializeJson(doc, payload, length);

        RemoteCommand cmd;
        if (err) {
            Serial.printf("[Dto] JSON 解析失败: %s\n", err.c_str());
            return cmd;  // action 为空字符串
        }

        cmd.action = doc["action"] | "";
        if (doc.containsKey("params")) {
            serializeJson(doc["params"], cmd.params);
        }
        return cmd;
    }
};

// ──────────────────────────────────
//  ACStateMessage
//  空调当前状态上报消息
//  JSON 格式：
//  {"power":true,"mode":"cool","temperature":26,"swing":false,"windSpeed":"auto","sleep":false,"gentle":false,"onTimer":0,"offTimer":0}
// ──────────────────────────────────
struct ACStateMessage {
    bool     power;         // 开关状态
    String   mode;          // 模式: "cool" | "heat" | "dry" | "fan"
    int      temperature;   // 温度 16~30
    bool     swing;         // 摆风
    String   windSpeed;     // 风速: "auto" | "low" | "medium" | "high"
    bool     sleep;         // 睡眠模式
    bool     gentle;        // 舒风模式
    uint16_t onTimer;       // 定时开机（分钟），0=关闭，步长 20，最大 720
    uint16_t offTimer;      // 定时关机（分钟），0=关闭，步长 20，最大 720

    /** 序列化为 JSON 字符串 */
    String toJson() const {
        StaticJsonDocument<JSON_DOC_SIZE_AC_STATE> doc;
        doc["power"]       = power;
        doc["mode"]        = mode;
        doc["temperature"] = temperature;
        doc["swing"]       = swing;
        doc["windSpeed"]   = windSpeed;
        doc["sleep"]       = sleep;
        doc["gentle"]      = gentle;
        doc["onTimer"]     = onTimer;
        doc["offTimer"]    = offTimer;
        String json;
        serializeJson(doc, json);
        return json;
    }
};

#endif  // MESSAGE_DTO_H
