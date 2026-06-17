#include "BedroomAC.h"

// ============================================================
//  BedroomAC 实现
//  存储红外编码 + 按键操作 + action 路由 + AC 状态追踪
// ============================================================

// ──────────────────────────────────
//  红外编码存储
//  ※ 以下均为示例占位值，必须替换为实际遥控器编码
//    使用 IRrecvDumpV2 工具录制后，将 uint16_t rawData[] 复制至此
// ──────────────────────────────────

const uint16_t BedroomAC::RAW_TOGGLE_POWER[] = {
    // TODO: 替换为实际「开关机」按键的红外编码
    9000, 4500, 560, 560, 560, 560, 560, 1690, 560, 560,
    560, 560, 560, 560, 560, 560, 560, 560, 560, 1690,
    560, 1690, 560, 560, 560, 1690, 560, 1690, 560, 1690,
    560, 1690, 560, 1690, 560, 560, 560, 560, 560, 560,
    560, 1690, 560, 560, 560, 560, 560, 560, 560, 560,
    560, 1690, 560, 1690, 560, 1690, 560, 560, 560, 1690,
    560, 1690, 560, 1690, 560, 1690, 560, 39756
};
const size_t BedroomAC::RAW_TOGGLE_POWER_LEN =
    sizeof(RAW_TOGGLE_POWER) / sizeof(RAW_TOGGLE_POWER[0]);

const uint16_t BedroomAC::RAW_INCREASE_TEMP[] = {
    // TODO: 替换为实际「温度+」按键的红外编码
};
const size_t BedroomAC::RAW_INCREASE_TEMP_LEN =
    sizeof(RAW_INCREASE_TEMP) / sizeof(RAW_INCREASE_TEMP[0]);

const uint16_t BedroomAC::RAW_DECREASE_TEMP[] = {
    // TODO: 替换为实际「温度-」按键的红外编码
};
const size_t BedroomAC::RAW_DECREASE_TEMP_LEN =
    sizeof(RAW_DECREASE_TEMP) / sizeof(RAW_DECREASE_TEMP[0]);

const uint16_t BedroomAC::RAW_TOGGLE_SWING[] = {
    // TODO: 替换为实际「摆风」按键的红外编码
};
const size_t BedroomAC::RAW_TOGGLE_SWING_LEN =
    sizeof(RAW_TOGGLE_SWING) / sizeof(RAW_TOGGLE_SWING[0]);

const uint16_t BedroomAC::RAW_COOLING_MODE[] = {
    // TODO: 替换为实际「制冷」按键的红外编码
};
const size_t BedroomAC::RAW_COOLING_MODE_LEN =
    sizeof(RAW_COOLING_MODE) / sizeof(RAW_COOLING_MODE[0]);

const uint16_t BedroomAC::RAW_HEATING_MODE[] = {
    // TODO: 替换为实际「制热」按键的红外编码
};
const size_t BedroomAC::RAW_HEATING_MODE_LEN =
    sizeof(RAW_HEATING_MODE) / sizeof(RAW_HEATING_MODE[0]);

const uint16_t BedroomAC::RAW_DRY_MODE[] = {
    // TODO: 替换为实际「除湿」按键的红外编码
};
const size_t BedroomAC::RAW_DRY_MODE_LEN =
    sizeof(RAW_DRY_MODE) / sizeof(RAW_DRY_MODE[0]);

const uint16_t BedroomAC::RAW_FAN_MODE[] = {
    // TODO: 替换为实际「送风」按键的红外编码
};
const size_t BedroomAC::RAW_FAN_MODE_LEN =
    sizeof(RAW_FAN_MODE) / sizeof(RAW_FAN_MODE[0]);

const uint16_t BedroomAC::RAW_TOGGLE_WIND_SPEED[] = {
    // TODO: 替换为实际「风速切换」按键的红外编码
};
const size_t BedroomAC::RAW_TOGGLE_WIND_SPEED_LEN =
    sizeof(RAW_TOGGLE_WIND_SPEED) / sizeof(RAW_TOGGLE_WIND_SPEED[0]);

const uint16_t BedroomAC::RAW_GENTLE_MODE[] = {
    // TODO: 替换为实际「舒风模式」按键的红外编码
};
const size_t BedroomAC::RAW_GENTLE_MODE_LEN =
    sizeof(RAW_GENTLE_MODE) / sizeof(RAW_GENTLE_MODE[0]);

const uint16_t BedroomAC::RAW_TOGGLE_SLEEP[] = {
    // TODO: 替换为实际「睡眠模式」按键的红外编码
};
const size_t BedroomAC::RAW_TOGGLE_SLEEP_LEN =
    sizeof(RAW_TOGGLE_SLEEP) / sizeof(RAW_TOGGLE_SLEEP[0]);

// ──────────────────────────────────
//  构造与初始化
// ──────────────────────────────────

BedroomAC::BedroomAC(IrTransmitter &ir) : _ir(ir) {
    // 默认状态：关机、制冷模式、26°C、关摆风、自动风速、关睡眠、关舒风
    _state.power       = false;
    _state.mode        = "cool";
    _state.temperature = 26;
    _state.swing       = false;
    _state.windSpeed   = "auto";
    _state.sleep       = false;
    _state.gentle      = false;
}

void BedroomAC::begin() {
    Serial.println("[BedroomAC] 空调遥控器模块已就绪");
    Serial.println("[BedroomAC] 初始状态: " + _state.toJson());
    // 启动时主动上报一次初始状态
    _notifyState();
}

// ──────────────────────────────────
//  状态回调管理
// ──────────────────────────────────

void BedroomAC::setOnStateChanged(OnStateChanged callback) {
    _onStateChanged = callback;
}

void BedroomAC::_notifyState() {
    if (_onStateChanged) {
        String json = _state.toJson();
        _onStateChanged(json);
    }
}

// ──────────────────────────────────
//  风速切换辅助
// ──────────────────────────────────

const char* BedroomAC::_cycleWindSpeed(const String &current) {
    if (current == "auto")   return "low";
    if (current == "low")    return "medium";
    if (current == "medium") return "high";
    return "auto";  // "high" → "auto"
}

// ──────────────────────────────────
//  统一入口：action 路由
// ──────────────────────────────────

bool BedroomAC::handleAction(const String &action, const String &params) {
    // 根据 action 名称分发到对应按键方法
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
    if (action == "toggleSleepMode")    return toggleSleepMode();

    Serial.printf("[BedroomAC] 未知指令: %s\n", action.c_str());
    return false;
}

// ──────────────────────────────────
//  按键操作实现
// ──────────────────────────────────

bool BedroomAC::togglePower() {
    Serial.println("[BedroomAC] 开关机");
    if (RAW_TOGGLE_POWER_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_TOGGLE_POWER, RAW_TOGGLE_POWER_LEN);
    _state.power = !_state.power;  // 取反开关状态
    Serial.printf("[BedroomAC] 电源 → %s\n", _state.power ? "开" : "关");
    _notifyState();
    return true;
}

bool BedroomAC::increaseTemperature() {
    Serial.println("[BedroomAC] 温度+1");
    if (RAW_INCREASE_TEMP_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_INCREASE_TEMP, RAW_INCREASE_TEMP_LEN);
    if (_state.temperature < 30) _state.temperature++;
    Serial.printf("[BedroomAC] 温度 → %d°C\n", _state.temperature);
    _notifyState();
    return true;
}

bool BedroomAC::decreaseTemperature() {
    Serial.println("[BedroomAC] 温度-1");
    if (RAW_DECREASE_TEMP_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_DECREASE_TEMP, RAW_DECREASE_TEMP_LEN);
    if (_state.temperature > 16) _state.temperature--;
    Serial.printf("[BedroomAC] 温度 → %d°C\n", _state.temperature);
    _notifyState();
    return true;
}

bool BedroomAC::toggleSwing() {
    Serial.println("[BedroomAC] 摆风切换");
    if (RAW_TOGGLE_SWING_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_TOGGLE_SWING, RAW_TOGGLE_SWING_LEN);
    _state.swing = !_state.swing;  // 取反摆风状态
    Serial.printf("[BedroomAC] 摆风 → %s\n", _state.swing ? "开" : "关");
    _notifyState();
    return true;
}

bool BedroomAC::setCoolingMode() {
    Serial.println("[BedroomAC] 制冷模式");
    if (RAW_COOLING_MODE_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_COOLING_MODE, RAW_COOLING_MODE_LEN);
    _state.mode = "cool";
    Serial.println("[BedroomAC] 模式 → 制冷");
    _notifyState();
    return true;
}

bool BedroomAC::setHeatingMode() {
    Serial.println("[BedroomAC] 制热模式");
    if (RAW_HEATING_MODE_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_HEATING_MODE, RAW_HEATING_MODE_LEN);
    _state.mode = "heat";
    Serial.println("[BedroomAC] 模式 → 制热");
    _notifyState();
    return true;
}

bool BedroomAC::setDryMode() {
    Serial.println("[BedroomAC] 除湿模式");
    if (RAW_DRY_MODE_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_DRY_MODE, RAW_DRY_MODE_LEN);
    _state.mode = "dry";
    Serial.println("[BedroomAC] 模式 → 除湿");
    _notifyState();
    return true;
}

bool BedroomAC::setFanMode() {
    Serial.println("[BedroomAC] 送风模式");
    if (RAW_FAN_MODE_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_FAN_MODE, RAW_FAN_MODE_LEN);
    _state.mode = "fan";
    Serial.println("[BedroomAC] 模式 → 送风");
    _notifyState();
    return true;
}

bool BedroomAC::toggleWindSpeed() {
    Serial.println("[BedroomAC] 风速切换");
    if (RAW_TOGGLE_WIND_SPEED_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_TOGGLE_WIND_SPEED, RAW_TOGGLE_WIND_SPEED_LEN);
    _state.windSpeed = _cycleWindSpeed(_state.windSpeed);
    Serial.printf("[BedroomAC] 风速 → %s\n", _state.windSpeed.c_str());
    _notifyState();
    return true;
}

bool BedroomAC::enableGentleMode() {
    Serial.println("[BedroomAC] 舒风模式");
    if (RAW_GENTLE_MODE_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_GENTLE_MODE, RAW_GENTLE_MODE_LEN);
    _state.gentle = true;
    Serial.println("[BedroomAC] 舒风 → 开");
    _notifyState();
    return true;
}

bool BedroomAC::toggleSleepMode() {
    Serial.println("[BedroomAC] 睡眠模式");
    if (RAW_TOGGLE_SLEEP_LEN == 0) {
        Serial.println("[BedroomAC] 警告：红外编码未配置，跳过发射");
        return false;
    }
    _ir.sendRaw(RAW_TOGGLE_SLEEP, RAW_TOGGLE_SLEEP_LEN);
    _state.sleep = !_state.sleep;  // 取反睡眠状态
    Serial.printf("[BedroomAC] 睡眠 → %s\n", _state.sleep ? "开" : "关");
    _notifyState();
    return true;
}
