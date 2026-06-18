# 温湿度传感器模块设计文档

> 封装 DHT11 温湿度数据的接收与状态管理，通过 MQTT retained 消息获取实时读数，对外暴露数据查询与变更回调。
> 核心设计：纯只读传感器，仅订阅 MQTT，无需指令下发。

## 目录

- [1. 简介](#1-简介)
- [2. 运行流程图](#2-运行流程图)
- [3. 模块关系图](#3-模块关系图)
- [4. 目录结构](#4-目录结构)
- [5. 实现流程](#5-实现流程)

---

## 1. 简介

### 1.1 模块定位

控制器模块位于 MQTT 通信层之上，封装卧室 DHT11 温湿度传感器的数据接收与状态管理。

当前 ESP8266 终端定时读取 DHT11 并通过 MQTT retained 消息上报温湿度（默认每 60 秒一次）。

### 1.2 设计原则

TempHumidSensor 以单例形式提供，内部整合 MqttManager。调用方需要的能力：

- 读取当前温湿度实时数值
- 注册数据变更回调

> **注意**：温湿度传感器为纯只读模块，App 端无需下发任何指令到 ESP8266。

### 1.3 消息通道策略

| 场景 | 通道 | 说明 |
|---|---|---|
| 接收数据更新 | MQTT（retained） | ESP8266 定时上报，Broker 保留最新值，新订阅者立即可获取 |

无需 UDP — 传感器数据仅通过 MQTT retained 消息单向推送。

### 1.4 消息格式

#### MQTT 数据消息（终端 → Broker → 客户端，retained）

Topic: `YHHome/sensor/tempHumid`
Payload:

```json
{"temperature":26.0,"humidity":58.0}
```

> **说明**：DHT11 精度为整数，temperature 和 humidity 均为 `float` 类型。上报间隔由 Arduino Config.h 中 `DHT_REPORT_INTERVAL` 控制（默认 60000ms）。

### 1.5 对外 API

```kotlin
// 获取单例
val sensor = TempHumidSensor.getInstance()

// ── 属性 ──
val state: TempHumidState = sensor.currentState

// ── 数据回调 ──
sensor.addCallback(callback: TempHumidCallback)
sensor.removeCallback(callback: TempHumidCallback)
```

### 1.6 依赖

无额外第三方依赖，依赖 `mqtt` 模块。

---

## 2. 运行流程图

### 2.1 接收数据更新

```
ESP8266 终端                 MQTT Broker              TempHumidSensor
  │                              │                          │
  │ loop() 每 60 秒               │                          │
  │ dhtSensor.read()             │                          │
  │ TempHumidMessage.toJson()    │                          │
  │ {"temperature":26.0,         │                          │
  │  "humidity":58.0}            │                          │
  │ mqtt.publish(                │                          │
  │   TOPIC_SENSOR_TEMP_HUMID,   │                          │
  │   json, retained=true)       │                          │
  │ ──────────────────────────→  │                          │
  │                              ├─ messageArrived ────────→
  │                              │  (已订阅该 topic)         │
  │                              │                         ├─ parse TempHumidState
  │                              │                         ├─ 更新 state
  │                              │                         └─ callbacks.onStateChanged()
  │                              │                          │
  │                              │                  调用方 ← onStateChanged(state)
```

### 2.2 初始化

```
调用方                  TempHumidSensor             MqttManager
  │                            │                        │
  │ ① getInstance()            │                        │
  │                            ├─ 首次调用 → init()      │
  │                            │  ├─ mqtt.subscribe(     │
  │                            │  │    TOPIC_SENSOR,     │
  │                            │  │    qos=0,            │
  │                            │  │    dataCallback) ───→ 订阅 retained 数据
  │  ←─ 返回单例               │                        │
```

---

## 3. 模块关系图

### 3.1 内部结构

```
┌──────────────────────────────────────────────────────────────────┐
│              controller/tempHumid/ 模块内部                          │
│                                                                  │
│  ┌──────────────────┐                                            │
│  │ TempHumidConfig  │  (internal)                                │
│  │ ─────────────────│                                            │
│  │ + TOPIC_SENSOR   │                                            │
│  └────────┬─────────┘                                            │
│           │                                                      │
│  ┌────────▼─────────┐       ┌──────────────────┐                 │
│  │  TempHumidSensor │──────▶│ MqttManager      │                 │
│  │  (单例)          │  调用  │  (mqtt 模块)     │                 │
│  │ ─────────────────│       └──────────────────┘                 │
│  │ + getInstance()  │                                           │
│  │ + currentState   │       ┌──────────────────┐                 │
│  │ + addCallback()  │  持有 │ TempHumidState   │                 │
│  │ + removeCallback()│─────▶│  (当前数据)      │                 │
│  └──────────────────┘       └──────────────────┘                 │
│                                                                  │
│  持有 ┌──────────────────┐                                       │
│  ───▶│ TempHumidCallback │                                       │
│       │  列表             │                                       │
│       └──────────────────┘                                       │
│                                                                  │
│  ┌──────────────────────┐                                        │
│  │ TempHumidState       │  (public)                              │
│  │ ─────────────────────│                                        │
│  │ + temperature: Float │                                        │
│  │ + humidity: Float    │                                        │
│  └──────────────────────┘                                        │
│                                                                  │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│         调用方                │
│                              │
│ TempHumidCallback (接口)      │
│ ────────────────────────────│
│ + onStateChanged(state)     │
│                              │
│ TempHumidSensor.getInstance()│
│   .currentState              │
│   .addCallback(...)          │
│   .removeCallback(...)       │
└──────────────────────────────┘
```

### 3.2 接口可见性

| 类 / 接口 | 可见性 | 说明 |
|-----------|--------|------|
| `TempHumidSensor` | public | 单例控制器，对外唯一入口 |
| `TempHumidState` | public | 温湿度数据类 |
| `TempHumidCallback` | public | 数据变更回调接口 |
| `TempHumidConfig` | internal | MQTT Topic 常量 |

### 3.3 内部配置

```kotlin
internal object TempHumidConfig {
    const val TOPIC_SENSOR = "YHHome/sensor/tempHumid"
}
```

### 3.4 类接口属性方法说明

#### TempHumidSensor（单例控制器）

| 成员 | 类型 | 说明 |
|------|------|------|
| `getInstance()` | `static fun` | 获取单例，首次调用自动订阅 MQTT 数据主题 |
| `currentState` | `val TempHumidState` | 当前温湿度实时数据 |
| `addCallback(callback)` | `fun` | 注册数据变更回调，重复注册自动去重 |
| `removeCallback(callback)` | `fun` | 移除数据变更回调 |

#### TempHumidState（数据类）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `temperature` | `Float` | `0f` | 温度（°C），DHT11 精度为整数，以 Float 存储 |
| `humidity` | `Float` | `0f` | 相对湿度（%），DHT11 精度为整数，以 Float 存储 |

> **注意**：ESP8266 端使用 DHT11 传感器，上报值默认为整数。使用 `Float` 类型以兼容未来可能升级的 DHT22 等更高精度传感器。读取失败时 Arduino 端返回 `-999`，Android 端保持上一次的有效值不变。

#### TempHumidCallback（回调接口）

| 方法 | 说明 |
|------|------|
| `onStateChanged(state: TempHumidState)` | 数据更新时回调，携带最新完整数据。在主线程调用 |

#### TempHumidConfig（内部配置）

| 常量 | 类型 | 值 | 说明 |
|------|------|-----|------|
| `TOPIC_SENSOR` | `String` | `"YHHome/sensor/tempHumid"` | 温湿度数据 Topic（retained），与 Arduino `Config.h` 中 `TOPIC_SENSOR_TEMP_HUMID` 一致 |

---

## 4. 目录结构

```
app/src/main/java/com/yuwjoo/myhome/modules/controller/tempHumid/
├── DESIGN.md
├── TempHumidState.kt
├── TempHumidCallback.kt
├── TempHumidConfig.kt
└── TempHumidSensor.kt
```

| 文件 | 可见性 | 职责 |
|------|--------|------|
| `TempHumidSensor.kt` | public | 单例控制器，订阅 MQTT 数据、管理状态与回调 |
| `TempHumidState.kt` | public | 温湿度数据类 |
| `TempHumidCallback.kt` | public | 数据变更回调接口 |
| `TempHumidConfig.kt` | internal | MQTT Topic 常量 |

---

## 5. 实现流程

### 5.1 步骤 1 — `TempHumidState`、`TempHumidCallback`、`TempHumidConfig`

```kotlin
package com.yuwjoo.myhome.modules.controller.tempHumid

data class TempHumidState(
    val temperature: Float = 0f, // 温度 °C
    val humidity: Float = 0f, // 湿度 %
)
```

```kotlin
package com.yuwjoo.myhome.modules.controller.tempHumid

interface TempHumidCallback {
    /**
     * 温湿度数据更新
     * @param state 最新温湿度数据
     */
    fun onStateChanged(state: TempHumidState)
}
```

```kotlin
package com.yuwjoo.myhome.modules.controller.tempHumid

internal object TempHumidConfig {
    const val TOPIC_SENSOR = "YHHome/sensor/tempHumid"
}
```

### 5.2 步骤 2 — `TempHumidSensor`

```kotlin
package com.yuwjoo.myhome.modules.controller.tempHumid

import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.modules.mqtt.MqttManager
import com.yuwjoo.myhome.modules.mqtt.MqttTopicCallback
import org.json.JSONObject

class TempHumidSensor private constructor() {

    companion object {
        private val _instance: TempHumidSensor by lazy { TempHumidSensor().also { it.init() } }

        fun getInstance(): TempHumidSensor = _instance
    }

    private val callbacks = mutableListOf<TempHumidCallback>()
    private var state = TempHumidState()
    private val handler = Handler(Looper.getMainLooper())
    private var initialized = false

    val currentState: TempHumidState
        get() = state

    private fun init() {
        if (initialized) return
        initialized = true

        // 订阅 MQTT 温湿度主题（retained 消息，QoS 0 即可）
        MqttManager.getInstance().subscribe(
            topic = TempHumidConfig.TOPIC_SENSOR,
            qos = 0,
            callback = object : MqttTopicCallback {
                override fun onMessageArrived(topic: String, payload: String) {
                    applyStateFromJson(payload)
                }
            }
        )
    }

    fun addCallback(callback: TempHumidCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: TempHumidCallback) {
        callbacks.remove(callback)
    }

    /**
     * 解析 MQTT 收到的 retained 温湿度 JSON
     * 格式：{"temperature":26.0,"humidity":58.0}
     */
    private fun applyStateFromJson(jsonStr: String) {
        try {
            val json = JSONObject(jsonStr)
            val temperature = json.optDouble("temperature", state.temperature.toDouble()).toFloat()
            val humidity = json.optDouble("humidity", state.humidity.toDouble()).toFloat()

            val newState = TempHumidState(temperature, humidity)

            if (newState != state) {
                state = newState
                handler.post {
                    callbacks.forEach { it.onStateChanged(state) }
                }
            }
        } catch (_: Exception) { }
    }
}
```

### 5.3 步骤 3 — 使用示例

```kotlin
class DashboardActivity : AppCompatActivity() {

    private val sensorCallback = object : TempHumidCallback {
        override fun onStateChanged(state: TempHumidState) {
            binding.tvTemperature.text = "${state.temperature.toInt()}°C"
            binding.tvHumidity.text = "${state.humidity.toInt()}%"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sensor = TempHumidSensor.getInstance()
        sensor.addCallback(sensorCallback)
        updateUI(sensor.currentState)
    }

    override fun onDestroy() {
        super.onDestroy()
        TempHumidSensor.getInstance().removeCallback(sensorCallback)
    }

    private fun updateUI(state: TempHumidState) {
        binding.tvTemperature.text = "${state.temperature.toInt()}°C"
        binding.tvHumidity.text = "${state.humidity.toInt()}%"
    }
}

// 任意位置读取当前数值
val temp = TempHumidSensor.getInstance().currentState.temperature  // 26.0
val humid = TempHumidSensor.getInstance().currentState.humidity    // 58.0
```

### 5.4 与 BedroomAC 的对比

| 维度 | BedroomAC | TempHumidSensor |
|------|-----------|-----------------|
| 类型 | 可读写（控制 + 读取） | 只读（仅数据接收） |
| 通信通道 | MQTT + UDP 双通道 | 仅 MQTT |
| 指令下发 | 是（UDP 优先，MQTT 兜底） | 否 |
| 设备发现 | 是（UDP scanDevices） | 否 |
| 数据方向 | 双向 | 单向（终端 → App） |
| state 字段数 | 9 个 | 2 个 |
| 数值类型 | Int、Boolean、String | Float、Float |
