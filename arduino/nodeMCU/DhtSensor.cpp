#include "DhtSensor.h"

// ============================================================
//  DhtSensor 实现
//  基于 SimpleDHT 库
// ============================================================

#include <SimpleDHT.h>

void DhtSensor::begin() {
    Serial.println("[DHT11] 传感器已就绪");
}

bool DhtSensor::read() {
    SimpleDHT11 dht11(DHT_PIN);
    byte temperature = 0;
    byte humidity = 0;
    int err = dht11.read(&temperature, &humidity, nullptr);

    if (err != SimpleDHTErrSuccess) {
        Serial.print("[DHT11] 读取失败，错误码: ");
        Serial.print(err);
        Serial.print(" (");
        Serial.print(SimpleDHTErrCode(err));
        Serial.println(")");
        _lastReadSuccess = false;
        return false;
    }

    // DHT11 精度为整数
    _temperature = (float)temperature;
    _humidity = (float)humidity;
    _lastReadSuccess = true;

    Serial.printf("[DHT11] 温度: %.0f°C, 湿度: %.0f%%\n",
                  _temperature, _humidity);
    return true;
}

float DhtSensor::getTemperature() {
    return _temperature;
}

float DhtSensor::getHumidity() {
    return _humidity;
}

bool DhtSensor::shouldReport() {
    unsigned long now = millis();
    if (_lastReportTime == 0 || (now - _lastReportTime >= DHT_REPORT_INTERVAL)) {
        _lastReportTime = now;
        return true;
    }
    return false;
}
