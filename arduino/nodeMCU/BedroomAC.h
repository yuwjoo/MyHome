#ifndef BEDROOM_AC_H
#define BEDROOM_AC_H

#include <Arduino.h>
#include "Config.h"
#include "IrTransmitter.h"
#include "MessageDto.h"

/**
 * BedroomAC — 卧室空调遥控器模块
 *
 * 职责：
 * - 存储所有空调操作对应的红外编码
 * - 实现各按键操作方法（togglePower、setCoolingMode 等）
 * - 提供统一的 handleAction() 入口，供 MQTT 回调调用
 * - 通过 IrTransmitter 发送红外信号
 * - **跟踪空调状态，每次操作后通过回调通知外部**
 *
 * 消息格式（与 Android BedroomAC 模块对应）：
 *   {"action":"togglePower"}
 *   {"action":"setTiming","params":{"minutes":60}}
 *
 * 支持的 action：
 *   togglePower, increaseTemperature, decreaseTemperature,
 *   toggleSwing, setCoolingMode, setHeatingMode,
 *   setDryMode, setFanMode, toggleWindSpeed,
 *   enableGentleMode, toggleSleepMode
 *
 * 使用方式：
 *   IrTransmitter ir;
 *   BedroomAC ac(ir);
 *   ac.begin();
 *   ac.setOnStateChanged([](const String &stateJson) {
 *       mqttManager.publish(topic, stateJson.c_str(), true);
 *   });
 *   ac.handleAction("togglePower");  // → 自动触发状态上报
 *
 * 状态说明：
 *   由于红外遥控是单向通信，无法获取空调真实状态，以下状态为本地追踪值：
 *   - toggle 类操作（开关/摆风/睡眠）：在本地状态上取反
 *   - 温度调节：在本地温度上 +/-1
 *   - 模式/风速切换：直接覆盖本地状态
 *   系统启动时使用默认值（关机/制冷/26°C/自动风速）
 *
 * ※ 红外编码说明：
 *    以下编码均为示例占位值，需使用 IRrecvDumpV2 录制实际遥控器编码后替换。
 *    每个按键独立存储，便于单独维护。
 */
class BedroomAC {
public:
    /**
     * 构造函数
     * @param ir 红外发射模块引用
     */
    explicit BedroomAC(IrTransmitter &ir);

    /**
     * 初始化模块
     * 在 setup() 中调用。
     */
    void begin();

    // ── 状态回调 ──

    /** 状态变更回调类型：参数为 AC 状态 JSON 字符串 */
    typedef void (*OnStateChanged)(const String &stateJson);

    /**
     * 设置状态变更监听器
     * 每次空调操作成功后，回调会被调用，传入最新的 ACStateMessage JSON。
     * @param callback 回调函数（或 lambda）
     */
    void setOnStateChanged(OnStateChanged callback);

    // ── 统一入口 ──

    /**
     * 根据 action 名称执行对应操作
     * 供 MQTT 消息回调调用，解析 JSON 中的 action 后传入。
     *
     * @param action 指令名称（如 "togglePower"）
     * @param params 指令参数（JSON 字符串），无参数时传 ""
     * @return true=操作已执行（含编码未配置时打印警告也返回 true）
     */
    bool handleAction(const String &action, const String &params = "");

    // ── 按键操作（公有，外部可直接调用）──

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
    bool toggleSleepMode();      // 睡眠模式

private:
    IrTransmitter &_ir;          // 红外发射模块引用
    OnStateChanged _onStateChanged = nullptr;  // 状态变更回调

    // ── AC 状态追踪 ──
    ACStateMessage _state;       // 本地追踪的空调状态

    /**
     * 通知状态变更（内部调用）
     * 将当前 _state 序列化为 JSON，通过回调通知外界。
     */
    void _notifyState();

    // ── 风速切换辅助 ──
    static const char* _cycleWindSpeed(const String &current);

    // ── 红外编码存储（每个按键独立数组）──
    // 编码格式：脉冲/间隔交替，单位微秒，38kHz 载波
    // 使用 IRrecvDumpV2 录制实际遥控器编码后替换

    static const uint16_t RAW_TOGGLE_POWER[];
    static const size_t  RAW_TOGGLE_POWER_LEN;

    static const uint16_t RAW_INCREASE_TEMP[];
    static const size_t  RAW_INCREASE_TEMP_LEN;

    static const uint16_t RAW_DECREASE_TEMP[];
    static const size_t  RAW_DECREASE_TEMP_LEN;

    static const uint16_t RAW_TOGGLE_SWING[];
    static const size_t  RAW_TOGGLE_SWING_LEN;

    static const uint16_t RAW_COOLING_MODE[];
    static const size_t  RAW_COOLING_MODE_LEN;

    static const uint16_t RAW_HEATING_MODE[];
    static const size_t  RAW_HEATING_MODE_LEN;

    static const uint16_t RAW_DRY_MODE[];
    static const size_t  RAW_DRY_MODE_LEN;

    static const uint16_t RAW_FAN_MODE[];
    static const size_t  RAW_FAN_MODE_LEN;

    static const uint16_t RAW_TOGGLE_WIND_SPEED[];
    static const size_t  RAW_TOGGLE_WIND_SPEED_LEN;

    static const uint16_t RAW_GENTLE_MODE[];
    static const size_t  RAW_GENTLE_MODE_LEN;

    static const uint16_t RAW_TOGGLE_SLEEP[];
    static const size_t  RAW_TOGGLE_SLEEP_LEN;
};

#endif  // BEDROOM_AC_H
