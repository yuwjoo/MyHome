#include "IrTransmitter.h"

// ============================================================
//  IrTransmitter 实现
//  基于 IRremoteESP8266 库
//  安装：Arduino 库管理器搜索 "IRremoteESP8266"
// ============================================================

#include <IRremoteESP8266.h>
#include <IRsend.h>

// 红外发送器实例（引脚在 Config.h 中配置）
static IRsend irSend(IR_LED_PIN);

void IrTransmitter::begin() {
    irSend.begin();
    Serial.printf("[IR] 红外发射模块已就绪（引脚: %d）\n", IR_LED_PIN);
}

void IrTransmitter::sendRaw(const uint16_t *rawData, size_t length) {
    Serial.printf("[IR] 正在发射红外信号（%d 个脉冲）...\n", length);
    // 使用 38kHz 载波频率
    irSend.sendRaw(const_cast<uint16_t *>(rawData), length, 38);
    Serial.println("[IR] 发射完成");
}
