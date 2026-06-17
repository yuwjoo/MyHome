#ifndef DHT_SENSOR_H
#define DHT_SENSOR_H

#include <Arduino.h>
#include "Config.h"
#include "MessageDto.h"

/**
 * DhtSensor — DHT11 温湿度传感器模块
 *
 * 职责：
 * - 读取 DHT11 传感器的温度和湿度
 * - 按可配置的时间间隔判断是否需要上报
 *
 * 注意：不再直接生成 JSON 字符串，
 * 由调用方通过 TempHumidMessage 组装并序列化。
 *
 * 使用方式：
 *   DhtSensor dht;
 *   dht.begin();
 *   if (dht.shouldReport() && dht.read()) {
 *       TempHumidMessage msg;
 *       msg.temperature = dht.getTemperature();
 *       msg.humidity    = dht.getHumidity();
 *       mqtt.publish(topic, msg.toJson().c_str());
 *   }
 */
class DhtSensor {
public:
    /** 初始化传感器，在 setup() 中调用 */
    void begin();

    /** 读取一次温湿度 */
    bool read();

    /** 获取最近一次读取的温度（°C），失败返回 -999 */
    float getTemperature();

    /** 获取最近一次读取的湿度（%），失败返回 -999 */
    float getHumidity();

    /** 判断是否达到上报间隔 */
    bool shouldReport();

private:
    float _temperature = -999;
    float _humidity = -999;
    unsigned long _lastReportTime = 0;
    bool _lastReadSuccess = false;
};

#endif  // DHT_SENSOR_H
