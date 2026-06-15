# 智能家居控制器模块设计文档

> 封装具体设备的操作方法，整合 MQTT 与 UDP 双通道通信，对外暴露设备操作 API 与实时状态。
> 核心设计：优先局域网直连，MQTT 作为兜底；双通道订阅状态，统一状态管理。

## 目录

- [1. 简介](#1-简介)
- [2. 运行流程图](#2-运行流程图)
- [3. 模块关系图](#3-模块关系图)
- [4. 目录结构](#4-目录结构)
- [5. 实现流程](#5-实现流程)

---

## 1. 简介

### 1.1 模块定位

控制器模块位于 MQTT / UDP 通信层之上，封装具体智能设备的操作逻辑与状态管理。当前仅实现卧室空调遥控器（BedroomAC），后续可扩展其他设备。

### 1.2 设计原则

BedroomAC 以单例形式提供，内部整合 MqttManager 与 UdpManager。调用方需要的能力：

- 操作空调（开关、调温、模式切换、风速、摆风、睡眠、定时等）
- 读取当前空调实时状态
- 注册状态变更回调

### 1.3 消息通道策略

| 场景 | 通道 | 说明 |
|---|---|---|
| 发送控制指令 | UDP 单播（优先） | 局域网内存在在线空调设备时，直连发送，低延迟 |
| 发送控制指令 | MQTT（兜底） | 局域网无在线设备时，通过 MQTT Broker 中转 |
| 接收状态变更 | MQTT + UDP 双订阅 | 同时监听两个通道，任一通道收到状态消息均更新 |

### 1.4 对外 API

```kotlin
// 获取单例（首次调用自动初始化，订阅 MQTT + UDP 状态主题）
val ac = BedroomAC.getInstance()

// ── 属性 ──
val state: ACState = ac.currentState                    // 当前空调实时状态（只读）

// ── 状态回调 ──
ac.addCallback(callback: ACStateCallback)                // 注册状态变更回调，重复注册自动去重
ac.removeCallback(callback: ACStateCallback)             // 移除状态变更回调

// ── 操作 ──
ac.togglePower()                                         // 切换电源开关
ac.increaseTemperature()                                 // 温度 +1
ac.decreaseTemperature()                                 // 温度 -1
ac.toggleSwing()                                         // 切换摆风开关
ac.setCoolingMode()                                      // 切换为制冷模式
ac.setHeatingMode()                                      // 切换为制热模式
ac.setDryMode()                                          // 切换为除湿模式
ac.setFanMode()                                          // 切换为送风模式
ac.toggleWindSpeed()                                     // 循环切换风速（自动→低→中→高）
ac.enableGentleMode()                                    // 启用舒风模式
ac.toggleSleepMode()                                     // 切换睡眠模式开关
ac.setTiming(minutes: Int)                              // 设置定时关闭，参数为分钟数
ac.cancelTiming()                                        // 取消定时
```

### 1.5 消息格式

控制指令与状态消息均使用 JSON，结构为 `topic` + `data`：

**控制指令（客户端 → 设备）：**
```json
{"topic": "YHHome/RC/bedroomAC", "data": {"action": "togglePower"}}
```

**状态消息（设备 → 客户端）：**
```json
{"topic": "YHHome/device/bedroomAC", "data": {"power": true, "temperature": 26, "mode": "cool", ...}}
```

### 1.6 依赖

本模块依赖已存在的 `mqtt` 与 `udp` 模块，无额外第三方依赖。

---

## 2. 运行流程图

### 2.1 发送控制指令

```
调用方                    BedroomAC              UdpManager          MqttManager
  │                            │                      │                    │
  │ ① togglePower()            │                      │                    │
  │                            ├─ 查找本地在线空调      │                    │
  │                            │  udp.deviceList       │                    │
  │                            │  .find { deviceType   │                    │
  │                            │    == "bedroomAC"}    │                    │
  │                            │    │                  │                    │
  │                            │    ├─ 找到 → ②          │                    │
  │                            │    │  udp.publish(     │                    │
  │                            │    │    topic, data,   │                    │
  │                            │    │    targetIp) ────→ 单播到设备 IP      │
  │                            │    │                  │                    │
  │                            │    └─ 未找到 → ③       │                    │
  │                            │       mqtt.publish(   │                    │
  │                            │         topic, msg) ──────────────────────→ Broker → 设备
```

### 2.2 接收状态变更

```
设备                        UdpManager / MqttManager          BedroomAC
  │                              │                                │
  │ 状态变更                      │                                │
  │ ├─ UDP 单播 →                │                                │
  │ │  {topic:YHHome/device/     │                                │
  │ │   bedroomAC, data:{...}}   │                                │
  │ │                            ├─ dispatchMessage() ────────────→
  │ │                            │  (已订阅该 topic)               │
  │ │                            │                                ├─ parseACState(data)
  │ │                            │                                ├─ 更新内部 state
  │ │                            │                                └─ callbacks.onStateChanged(state)
  │ │                            │                                  │
  │ └─ MQTT publish →           │                                  │
  │    {topic:YHHome/device/     │                                  │
  │     bedroomAC, data:{...}}   │                                  │
  │                              ├─ messageArrived() ─────────────→
  │                              │  (已订阅该 topic)               │
  │                              │                                ├─ parseACState(data)
  │                              │                                ├─ 更新内部 state
  │                              │                                └─ callbacks.onStateChanged(state)
  │                              │                                  │
  │                              │                          调用方 ← onStateChanged(state)
```

### 2.3 初始化与生命周期

```
调用方                    BedroomAC              UdpManager          MqttManager
  │                            │                      │                    │
  │ ① getInstance()            │                      │                    │
  │                            ├─ 首次调用 → init()    │                    │
  │                            │  ├─ udp.subscribe(    │                    │
  │                            │  │  DEVICE_BEDROOM_AC,│                    │
  │                            │  │  statusCallback) ──→ 注册 UDP 监听     │
  │                            │  │                    │                    │
  │                            │  ├─ mqtt.subscribe(   │                    │
  │                            │  │  DEVICE_BEDROOM_AC,│                    │
  │                            │  │  qos=1,            │                    │
  │                            │  │  statusCallback) ──────────────────────→ 注册 MQTT 监听
  │                            │  │                    │                    │
  │  ←─ 返回单例               │                      │                    │
```

---

## 3. 模块关系图

### 3.1 内部结构

```
┌──────────────────────────────────────────────────────────────────┐
│              controller/bedroomAC/ 模块内部                         │
│                                                                  │
│  ┌──────────────────┐                                            │
│  │ BedroomACConfig  │  (internal)                                │
│  │ ─────────────────│                                            │
│  │ + TOPIC_RC       │                                            │
│  │ + TOPIC_DEVICE   │                                            │
│  │ + DEVICE_TYPE    │                                            │
│  └────────┬─────────┘                                            │
│           │                                                      │
│  ┌────────▼─────────┐       ┌──────────────────┐                 │
│  │  BedroomAC       │──────▶│ UdpManager       │                 │
│  │  (单例)          │  调用  │  (udp 模块)      │                 │
│  │ ─────────────────│       └──────────────────┘                 │
│  │ + getInstance()  │       ┌──────────────────┐                 │
│  │ + currentState   │──────▶│ MqttManager      │                 │
│  │ + togglePower()  │  调用  │  (mqtt 模块)     │                 │
│  │ + incTemperature()│      └──────────────────┘                 │
│  │ + decTemperature()│                                           │
│  │ + toggleSwing()  │       ┌──────────────────┐                 │
│  │ + setCoolingMode()│  持有 │ ACState          │                 │
│  │ + setHeatingMode()│─────▶│  (当前状态)       │                 │
│  │ + setDryMode()   │       └──────────────────┘                 │
│  │ + setFanMode()   │                                           │
│  │ + toggleWindSpeed│       ┌──────────────────┐                 │
│  │ + enableGentle() │  持有 │ ACStateCallback   │                 │
│  │ + toggleSleep()  │──────▶│  列表             │                 │
│  │ + setTiming()    │       └──────────────────┘                 │
│  │ + cancelTiming() │                                            │
│  │ + addCallback()  │                                            │
│  │ + removeCallback()│                                           │
│  └──────────────────┘                                            │
│                                                                  │
│  ┌──────────────────┐                                            │
│  │ ACState          │  (public)                                  │
│  │ ─────────────────│                                            │
│  │ + power: Boolean │                                            │
│  │ + temperature: Int│                                           │
│  │ + mode: ACMode   │                                            │
│  │ + swing: Boolean │                                            │
│  │ + windSpeed: WS  │                                            │
│  │ + sleep: Boolean │                                            │
│  │ + gentle: Boolean│                                            │
│  │ + timing: Int?   │                                            │
│  └──────────────────┘                                            │
│                                                                  │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│         调用方                │
│                              │
│ ACStateCallback (接口)        │
│ ────────────────────────────│
│ + onStateChanged(state)      │
│                              │
│ BedroomAC.getInstance()     │
│   .currentState             │
│   .togglePower()            │
│   .increaseTemperature()    │
│   .setCoolingMode()         │
│   ...                       │
└──────────────────────────────┘
```

### 3.2 接口可见性

| 类 / 接口 | 可见性 | 说明 |
|-----------|--------|------|
| `BedroomAC` | public | 单例控制器，对外唯一入口 |
| `ACState` | public | 空调状态数据类 |
| `ACMode` | public | 空调模式枚举 |
| `WindSpeed` | public | 风速枚举 |
| `ACStateCallback` | public | 状态变更回调接口 |
| `BedroomACConfig` | internal | 主题等配置，模块内部可见 |

### 3.3 内部配置

```kotlin
internal object BedroomACConfig {
    const val TOPIC_RC = "YHHome/RC/bedroomAC"
    const val TOPIC_DEVICE = "YHHome/device/bedroomAC"
    const val DEVICE_TYPE = "bedroomAC"
}
```

### 3.4 类接口属性方法说明

#### BedroomAC（单例控制器）

| 成员 | 类型 | 说明 |
|------|------|------|
| `getInstance()` | `static fun` | 获取单例，首次调用自动初始化并订阅双通道状态 |
| `currentState` | `val ACState` | 当前空调实时状态 |
| `addCallback(callback)` | `fun` | 注册状态变更回调，重复注册自动去重 |
| `removeCallback(callback)` | `fun` | 移除状态变更回调 |
| `togglePower()` | `fun` | 切换电源开关 |
| `increaseTemperature()` | `fun` | 温度 +1 |
| `decreaseTemperature()` | `fun` | 温度 -1 |
| `toggleSwing()` | `fun` | 切换摆风开关 |
| `setCoolingMode()` | `fun` | 切换为制冷模式 |
| `setHeatingMode()` | `fun` | 切换为制热模式 |
| `setDryMode()` | `fun` | 切换为除湿模式 |
| `setFanMode()` | `fun` | 切换为送风模式 |
| `toggleWindSpeed()` | `fun` | 循环切换风速（自动 → 低 → 中 → 高 → 自动） |
| `enableGentleMode()` | `fun` | 启用舒风模式 |
| `toggleSleepMode()` | `fun` | 切换睡眠模式开关 |
| `setTiming(minutes)` | `fun` | 设置定时关闭，参数为分钟数 |
| `cancelTiming()` | `fun` | 取消定时 |

#### ACState（状态数据类）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `power` | `Boolean` | `false` | 电源状态，`true` 开机 |
| `temperature` | `Int` | `26` | 当前设定温度 |
| `mode` | `ACMode` | `COOL` | 工作模式 |
| `swing` | `Boolean` | `false` | 摆风状态，`true` 开启 |
| `windSpeed` | `WindSpeed` | `AUTO` | 风速档位 |
| `sleep` | `Boolean` | `false` | 睡眠模式，`true` 开启 |
| `gentle` | `Boolean` | `false` | 舒风模式，`true` 开启 |
| `timing` | `Int?` | `null` | 定时剩余分钟数，`null` 表示未设置 |

#### ACMode（模式枚举）

| 枚举值 | 说明 |
|--------|------|
| `COOL` | 制冷 |
| `HEAT` | 制热 |
| `DRY` | 除湿 |
| `FAN` | 送风 |
| `AUTO` | 自动 |

#### WindSpeed（风速枚举）

| 枚举值 | 说明 |
|--------|------|
| `AUTO` | 自动风速 |
| `LOW` | 低速 |
| `MEDIUM` | 中速 |
| `HIGH` | 高速 |

#### ACStateCallback（状态回调接口）

| 方法 | 说明 |
|------|------|
| `onStateChanged(state: ACState)` | 状态变更时回调，携带最新完整状态。在主线程调用 |

#### BedroomACConfig（内部配置）

| 常量 | 类型 | 值 | 说明 |
|------|------|-----|------|
| `TOPIC_RC` | `String` | `"YHHome/RC/bedroomAC"` | 遥控指令 Topic |
| `TOPIC_DEVICE` | `String` | `"YHHome/device/bedroomAC"` | 设备状态 Topic |
| `DEVICE_TYPE` | `String` | `"bedroomAC"` | 设备类型标识，用于从 UDP 设备列表中匹配 |

---

## 4. 目录结构

```
app/src/main/java/com/yuwjoo/myhome/modules/controller/
└── bedroomAC/
    ├── DESIGN.md
    ├── ACState.kt
    ├── ACMode.kt
    ├── WindSpeed.kt
    ├── ACStateCallback.kt
    ├── BedroomACConfig.kt
    └── BedroomAC.kt
```

| 文件 | 可见性 | 职责 |
|------|--------|------|
| `BedroomAC.kt` | public | 单例控制器，封装空调操作、状态管理、双通道收发 |
| `ACState.kt` | public | 空调状态数据类 |
| `ACMode.kt` | public | 空调模式枚举（制冷/制热/除湿/送风/自动） |
| `WindSpeed.kt` | public | 风速枚举（自动/低/中/高） |
| `ACStateCallback.kt` | public | 状态变更回调接口 |
| `BedroomACConfig.kt` | internal | 主题与设备类型常量 |

---

## 5. 实现流程

### 5.1 步骤 1 — `ACMode`、`WindSpeed`、`ACState`

```kotlin
package com.yuwjoo.myhome.modules.controller.bedroomAC

enum class ACMode {
    COOL,       // 制冷
    HEAT,       // 制热
    DRY,        // 除湿
    FAN,        // 送风
    AUTO,       // 自动
}

enum class WindSpeed {
    AUTO,       // 自动
    LOW,        // 低速
    MEDIUM,     // 中速
    HIGH,       // 高速
}

data class ACState(
    val power: Boolean = false,
    val temperature: Int = 26,
    val mode: ACMode = ACMode.COOL,
    val swing: Boolean = false,
    val windSpeed: WindSpeed = WindSpeed.AUTO,
    val sleep: Boolean = false,
    val gentle: Boolean = false,
    val timing: Int? = null,   // 定时剩余分钟数，null 表示未设置
)
```

### 5.2 步骤 2 — `ACStateCallback`

```kotlin
package com.yuwjoo.myhome.modules.controller.bedroomAC

interface ACStateCallback {
    /**
     * 空调状态发生变化
     * @param state 最新的完整状态
     */
    fun onStateChanged(state: ACState)
}
```

### 5.3 步骤 3 — `BedroomACConfig`

```kotlin
package com.yuwjoo.myhome.modules.controller.bedroomAC

internal object BedroomACConfig {
    const val TOPIC_RC = "YHHome/RC/bedroomAC"
    const val TOPIC_DEVICE = "YHHome/device/bedroomAC"
    const val DEVICE_TYPE = "bedroomAC"
}
```

### 5.4 步骤 4 — `BedroomAC`

```kotlin
package com.yuwjoo.myhome.modules.controller.bedroomAC

import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.modules.mqtt.MqttManager
import com.yuwjoo.myhome.modules.mqtt.MqttTopicCallback
import com.yuwjoo.myhome.modules.udp.UdpManager
import com.yuwjoo.myhome.modules.udp.UdpTopicCallback
import org.json.JSONObject

class BedroomAC private constructor() {

    companion object {
        private val instance: BedroomAC by lazy { BedroomAC().also { it.init() } }

        fun getInstance(): BedroomAC = instance
    }

    // ──────────────── 内部状态 ────────────────

    private val callbacks = mutableListOf<ACStateCallback>()
    private var state = ACState()
    private val handler = Handler(Looper.getMainLooper())
    private var initialized = false

    val currentState: ACState
        get() = state

    // ──────────────── 初始化 ────────────────

    private fun init() {
        if (initialized) return
        initialized = true

        // 订阅 MQTT 设备状态主题
        MqttManager.getInstance().subscribe(
            topic = BedroomACConfig.TOPIC_DEVICE,
            qos = 1,
            callback = object : MqttTopicCallback {
                override fun onMessageArrived(topic: String, payload: String) {
                    applyStateFromJson(payload)
                }
            }
        )

        // 订阅 UDP 设备状态主题
        UdpManager.getInstance().subscribe(
            topic = BedroomACConfig.TOPIC_DEVICE,
            callback = object : UdpTopicCallback {
                override fun onMessageArrived(topic: String, payload: Any?) {
                    applyStateFromPayload(payload)
                }
            }
        )
    }

    // ──────────────── 回调管理 ────────────────

    fun addCallback(callback: ACStateCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: ACStateCallback) {
        callbacks.remove(callback)
    }

    // ──────────────── 操作 API ────────────────

    fun togglePower() {
        sendCommand("togglePower")
    }

    fun increaseTemperature() {
        sendCommand("increaseTemperature")
    }

    fun decreaseTemperature() {
        sendCommand("decreaseTemperature")
    }

    fun toggleSwing() {
        sendCommand("toggleSwing")
    }

    fun setCoolingMode() {
        sendCommand("setCoolingMode")
    }

    fun setHeatingMode() {
        sendCommand("setHeatingMode")
    }

    fun setDryMode() {
        sendCommand("setDryMode")
    }

    fun setFanMode() {
        sendCommand("setFanMode")
    }

    fun toggleWindSpeed() {
        sendCommand("toggleWindSpeed")
    }

    fun enableGentleMode() {
        sendCommand("enableGentleMode")
    }

    fun toggleSleepMode() {
        sendCommand("toggleSleepMode")
    }

    fun setTiming(minutes: Int) {
        val params = JSONObject().apply { put("minutes", minutes) }
        sendCommand("setTiming", params)
    }

    fun cancelTiming() {
        sendCommand("cancelTiming")
    }

    // ──────────────── 消息收发 ────────────────

    private fun sendCommand(action: String, params: JSONObject? = null) {
        val data = JSONObject()
        data.put("action", action)
        if (params != null) data.put("params", params)

        val dataStr = data.toString()

        // 查找本地在线空调设备
        val acDevice = UdpManager.getInstance().deviceList
            .find { it.deviceType == BedroomACConfig.DEVICE_TYPE }

        if (acDevice != null) {
            // 局域网直连
            UdpManager.getInstance().publish(
                topic = BedroomACConfig.TOPIC_RC,
                payload = data,
                targetIp = acDevice.ipAddress,
            )
        } else {
            // MQTT 兜底
            MqttManager.getInstance().publish(
                topic = BedroomACConfig.TOPIC_RC,
                payload = dataStr,
                qos = 1,
            )
        }
    }

    // ──────────────── 状态解析 ────────────────

    private fun applyStateFromJson(jsonStr: String) {
        try {
            val json = JSONObject(jsonStr)
            // data 字段可能是嵌套的 JSON 对象或字符串
            val data = when {
                json.has("data") -> json.get("data")
                else -> json
            }
            applyStateFromPayload(data)
        } catch (_: Exception) { }
    }

    private fun applyStateFromPayload(payload: Any?) {
        val json = when (payload) {
            is JSONObject -> payload
            is String -> try { JSONObject(payload) } catch (_: Exception) { null }
            else -> null
        } ?: return

        val newState = ACState(
            power = json.optBoolean("power", state.power),
            temperature = json.optInt("temperature", state.temperature),
            mode = parseMode(json.optString("mode", "")),
            swing = json.optBoolean("swing", state.swing),
            windSpeed = parseWindSpeed(json.optString("windSpeed", "")),
            sleep = json.optBoolean("sleep", state.sleep),
            gentle = json.optBoolean("gentle", state.gentle),
            timing = if (json.has("timing")) {
                val t = json.optInt("timing", -1)
                if (t > 0) t else null
            } else {
                state.timing
            },
        )

        if (newState != state) {
            state = newState
            handler.post {
                callbacks.forEach { it.onStateChanged(state) }
            }
        }
    }

    private fun parseMode(value: String): ACMode? {
        return when (value.lowercase()) {
            "cool" -> ACMode.COOL
            "heat" -> ACMode.HEAT
            "dry" -> ACMode.DRY
            "fan" -> ACMode.FAN
            "auto" -> ACMode.AUTO
            else -> null
        }
    }

    private fun parseWindSpeed(value: String): WindSpeed? {
        return when (value.lowercase()) {
            "auto" -> WindSpeed.AUTO
            "low" -> WindSpeed.LOW
            "medium" -> WindSpeed.MEDIUM
            "high" -> WindSpeed.HIGH
            else -> null
        }
    }
}
```

### 5.5 步骤 5 — 使用示例

```kotlin
class BedroomACActivity : AppCompatActivity() {

    private val stateCallback = object : ACStateCallback {
        override fun onStateChanged(state: ACState) {
            // 更新 UI
            binding.tvTemperature.text = "${state.temperature}°C"
            binding.swPower.isChecked = state.power
            binding.tvMode.text = when (state.mode) {
                ACMode.COOL -> "制冷"
                ACMode.HEAT -> "制热"
                ACMode.DRY -> "除湿"
                ACMode.FAN -> "送风"
                ACMode.AUTO -> "自动"
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val ac = BedroomAC.getInstance()

        // 注册状态监听
        ac.addCallback(stateCallback)

        // 显示当前状态
        updateUI(ac.currentState)

        // 操作
        binding.btnPower.setOnClickListener { ac.togglePower() }
        binding.btnTempUp.setOnClickListener { ac.increaseTemperature() }
        binding.btnTempDown.setOnClickListener { ac.decreaseTemperature() }
        binding.btnCool.setOnClickListener { ac.setCoolingMode() }
        binding.btnHeat.setOnClickListener { ac.setHeatingMode() }
        binding.btnSwing.setOnClickListener { ac.toggleSwing() }
        binding.btnWindSpeed.setOnClickListener { ac.toggleWindSpeed() }
        binding.btnSleep.setOnClickListener { ac.toggleSleepMode() }
    }

    override fun onDestroy() {
        super.onDestroy()
        BedroomAC.getInstance().removeCallback(stateCallback)
    }

    private fun updateUI(state: ACState) { /* ... */ }
}

// 任意位置读取当前状态
val isOn = BedroomAC.getInstance().currentState.power
val temp = BedroomAC.getInstance().currentState.temperature

// 任意位置操作
BedroomAC.getInstance().togglePower()
BedroomAC.getInstance().setCoolingMode()
BedroomAC.getInstance().setTiming(minutes = 60)
```
