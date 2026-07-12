#include "BedroomAC.h"
#include "Log.h"

BedroomAC::BedroomAC() : _ac(IR_LED_PIN) {
    _state.power       = false;   // 开关：true=开, false=关
    _state.mode        = "cool";  // 模式："cool"制冷 | "heat"制热 | "dry"除湿 | "fan"送风
    _state.temperature = 26;      // 设定温度：16~30 °C
    _state.swing       = false;   // 摆风：true=开, false=关
    _state.windSpeed   = "auto";  // 风速："auto"自动 | "low"低 | "medium"中 | "high"高
    _state.gentle      = false;   // 舒风模式：true=开, false=关
    _state.light       = true;    // 屏显：true=亮, false=灭
    _state.onTimer     = 0;       // 定时开机（分钟），0=关闭
    _state.offTimer    = 0;       // 定时关机（分钟），0=关闭
}

void BedroomAC::begin() {
    _ac.begin();
    LOG_PRINTLN("[BedroomAC] TCL112AC 协议模块已就绪");
    LOG_PRINTF("[BedroomAC] 初始状态: %s\n", _state.toJson().c_str());
    _notifyState();
}

void BedroomAC::setOnStateChanged(OnStateChanged callback) {
    _onStateChanged = callback;
}

void BedroomAC::_notifyState() {
    if (_onStateChanged) {
        String json = _state.toJson();
        _onStateChanged(json);
    }
}

const char* BedroomAC::_cycleWindSpeed(const String &current) {
    if (current == "auto")   return "low";
    if (current == "low")    return "medium";
    if (current == "medium") return "high";
    return "auto";
}

void BedroomAC::_syncAndSend() {
    _ac.setPower(_state.power);

    if (_state.mode == "cool")      _ac.setMode(kTcl112AcCool);
    else if (_state.mode == "heat") _ac.setMode(kTcl112AcHeat);
    else if (_state.mode == "dry")  _ac.setMode(kTcl112AcDry);
    else if (_state.mode == "fan")  _ac.setMode(kTcl112AcFan);

    _ac.setTemp(_state.temperature);

    if (_state.windSpeed == "auto")        _ac.setFan(kTcl112AcFanAuto);
    else if (_state.windSpeed == "low")    _ac.setFan(kTcl112AcFanLow);
    else if (_state.windSpeed == "medium") _ac.setFan(kTcl112AcFanMed);
    else if (_state.windSpeed == "high")   _ac.setFan(kTcl112AcFanHigh);

    _ac.setSwingVertical(_state.swing);
    _ac.setEcono(_state.gentle);
    _ac.setLight(_state.light);
    _ac.setOnTimer(_state.onTimer);
    _ac.setOffTimer(_state.offTimer);

    _ac.send();
}

bool BedroomAC::handleAction(const String &action, const String &params) {
    if (action == "togglePower")        return togglePower();
    if (action == "increaseTemperature") return increaseTemperature();
    if (action == "decreaseTemperature") return decreaseTemperature();
    if (action == "toggleSwing")        return toggleSwing();
    if (action == "setCoolingMode")     return setCoolingMode();
    if (action == "setHeatingMode")     return setHeatingMode();
    if (action == "setDryMode")         return setDryMode();
    if (action == "setFanMode")         return setFanMode();
    if (action == "toggleWindSpeed")    return toggleWindSpeed();
    if (action == "enableGentleMode")   return enableGentleMode();
    if (action == "toggleLight")        return toggleLight();
    if (action == "setOnTimer")         return setOnTimer(params);
    if (action == "setOffTimer")        return setOffTimer(params);
    if (action == "cancelOnTimer")      return cancelOnTimer();
    if (action == "cancelOffTimer")     return cancelOffTimer();

    LOG_PRINTF("[BedroomAC] 未知指令: %s\n", action.c_str());
    return false;
}

bool BedroomAC::togglePower() {
    _state.power = !_state.power;
    LOG_PRINTF("[BedroomAC] 电源 → %s\n", _state.power ? "开" : "关");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::increaseTemperature() {
    if (_state.temperature < 30) _state.temperature++;
    LOG_PRINTF("[BedroomAC] 温度 → %d°C\n", _state.temperature);
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::decreaseTemperature() {
    if (_state.temperature > 16) _state.temperature--;
    LOG_PRINTF("[BedroomAC] 温度 → %d°C\n", _state.temperature);
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::toggleSwing() {
    _state.swing = !_state.swing;
    LOG_PRINTF("[BedroomAC] 摆风 → %s\n", _state.swing ? "开" : "关");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::setCoolingMode() {
    _state.mode = "cool";
    LOG_PRINTLN("[BedroomAC] 模式 → 制冷");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::setHeatingMode() {
    _state.mode = "heat";
    LOG_PRINTLN("[BedroomAC] 模式 → 制热");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::setDryMode() {
    _state.mode = "dry";
    LOG_PRINTLN("[BedroomAC] 模式 → 除湿");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::setFanMode() {
    _state.mode = "fan";
    LOG_PRINTLN("[BedroomAC] 模式 → 送风");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::toggleWindSpeed() {
    _state.windSpeed = _cycleWindSpeed(_state.windSpeed);
    LOG_PRINTF("[BedroomAC] 风速 → %s\n", _state.windSpeed.c_str());
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::enableGentleMode() {
    _state.gentle = true;
    LOG_PRINTLN("[BedroomAC] 舒风 → 开");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::toggleLight() {
    _state.light = !_state.light;
    LOG_PRINTF("[BedroomAC] 屏显 → %s\n", _state.light ? "亮" : "灭");
    _syncAndSend();
    _notifyState();
    return true;
}

uint16_t BedroomAC::_parseTimerMinutes(const String &params) {
    StaticJsonDocument<JSON_DOC_SIZE_RC> doc;
    DeserializationError err = deserializeJson(doc, params);
    if (err || !doc.containsKey("minutes")) {
        LOG_PRINTF("[BedroomAC] 定时器参数解析失败: %s\n", params.c_str());
        return UINT16_MAX;
    }
    uint16_t mins = doc["minutes"];
    if (mins > 720) mins = 720;  // 最大 12 小时
    return mins;
}

bool BedroomAC::setOnTimer(const String &params) {
    uint16_t mins = _parseTimerMinutes(params);
    if (mins == UINT16_MAX) return false;
    _state.onTimer = mins;
    LOG_PRINTF("[BedroomAC] 定时开机 → %d 分钟\n", mins);
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::setOffTimer(const String &params) {
    uint16_t mins = _parseTimerMinutes(params);
    if (mins == UINT16_MAX) return false;
    _state.offTimer = mins;
    LOG_PRINTF("[BedroomAC] 定时关机 → %d 分钟\n", mins);
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::cancelOnTimer() {
    _state.onTimer = 0;
    LOG_PRINTLN("[BedroomAC] 定时开机 → 取消");
    _syncAndSend();
    _notifyState();
    return true;
}

bool BedroomAC::cancelOffTimer() {
    _state.offTimer = 0;
    LOG_PRINTLN("[BedroomAC] 定时关机 → 取消");
    _syncAndSend();
    _notifyState();
    return true;
}
