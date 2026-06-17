#ifndef BEDROOM_AC_H
#define BEDROOM_AC_H

#include <Arduino.h>
#include <ir_Tcl.h>
#include "Config.h"
#include "MessageDto.h"

/**
 * BedroomAC — 卧室空调遥控器模块
 *
 * 使用 IRremoteESP8266 库的 IRTcl112Ac 类，通过 TCL112AC 协议发送
 * 完整的空调状态帧，替代逐按键发送原始红外编码的方式。
 *
 * 支持的 action：togglePower, increaseTemperature, decreaseTemperature,
 *   toggleSwing, setCoolingMode, setHeatingMode, setDryMode, setFanMode,
 *   toggleWindSpeed, enableGentleMode, toggleLight,
 *   setOnTimer, setOffTimer, cancelOnTimer, cancelOffTimer
 *
 * 状态说明：红外遥控单向通信，无法获取空调真实状态，
 *   本地追踪值在每次操作后更新并通过回调通知外界。
 */
class BedroomAC {
public:
    BedroomAC();

    void begin();

    // ── 状态回调 ──

    typedef void (*OnStateChanged)(const String &stateJson);

    void setOnStateChanged(OnStateChanged callback);

    // ── 统一入口 ──

    bool handleAction(const String &action, const String &params = "");

    // ── 按键操作 ──

    bool togglePower();          // 开关机
    bool increaseTemperature();  // 温度 +1
    bool decreaseTemperature();  // 温度 -1
    bool toggleSwing();          // 切换摆风
    bool setCoolingMode();       // 制冷模式
    bool setHeatingMode();       // 制热模式
    bool setDryMode();           // 除湿模式
    bool setFanMode();           // 送风模式
    bool toggleWindSpeed();      // 切换风速（自动→低→中→高→自动）
    bool enableGentleMode();     // 舒风模式
    bool toggleLight();          // 切换屏显
    bool setOnTimer();           // 设置定时开机
    bool setOffTimer();          // 设置定时关机
    bool cancelOnTimer();        // 取消定时开机
    bool cancelOffTimer();       // 取消定时关机

private:
    IRTcl112Ac _ac;                       // TCL112AC 协议红外发送器
    OnStateChanged _onStateChanged = nullptr;  // 状态变更回调
    ACStateMessage _state;                 // 本地追踪的空调状态
    String _currentParams;                 // 当前指令的参数字符串

    /**
     * 将当前 _state 同步到 _ac 并发送完整协议帧
     */
    void _syncAndSend();

    void _notifyState();
    uint16_t _parseTimerMinutes();       // 从 _currentParams 解析 minutes 字段

    static const char* _cycleWindSpeed(const String &current);
};

#endif  // BEDROOM_AC_H
