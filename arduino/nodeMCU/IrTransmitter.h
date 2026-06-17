#ifndef IR_TRANSMITTER_H
#define IR_TRANSMITTER_H

#include <Arduino.h>
#include "Config.h"

/**
 * IrTransmitter — 红外信号发射模块（纯底层，不含业务逻辑）
 *
 * 职责：
 * - 初始化红外发射引脚
 * - 发送原始红外脉冲编码
 *
 * 不包含任何空调控制相关的逻辑（如按键映射、指令路由），
 * 这些由上层 BedroomAC 模块负责。
 *
 * 使用方式：
 *   IrTransmitter ir;
 *   ir.begin();
 *   ir.sendRaw(rawData, length);  // 发送一段红外脉冲
 */
class IrTransmitter {
public:
    /**
     * 初始化红外发射模块
     * 在 setup() 中调用。
     */
    void begin();

    /**
     * 发送原始红外脉冲编码
     * 使用 38kHz 载波频率（大多数空调遥控器使用此频率）。
     *
     * @param rawData 红外编码数组（脉冲/间隔交替，单位微秒）
     * @param length  数组长度
     */
    void sendRaw(const uint16_t *rawData, size_t length);
};

#endif  // IR_TRANSMITTER_H
