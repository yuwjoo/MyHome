# 卧室空调控制器模块设计文档

> 封装卧室空调的操作方法，整合 MQTT 与 UDP 双通道通信，对外暴露设备操作 API 与实时状态。
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

控制器模块位于 MQTT / UDP 通信层之上，封装卧室空调遥控器的操作逻辑与状态管理。

当前 ESP8266 终端通过 MQTT 接收遥控指令、上报空调状态，使用 TCL112AC 红外协议控制空调。

### 1.2 设计原则

BedroomAC 以单例形式提供，内部整合 MqttManager 与 UdpManager。调用方需要的能力：

- 操作空调（开关、调温、模式、风速、摆风、舒风、屏显、定时）
- 读取当前空调实时状态
- 注册状态变更回调

### 1.3 消息通道策略

| 场景 | 通道 | 说明 |
|---|---|---|
| 发送控制指令 | UDP 单播（优先） | 局域网内存在在线空调设备时，直连发送，低延迟 |
| 发送控制指令 | MQTT（兜底） | 局域网无在线设备时，通过 MQTT Broker 中转 |
| 接收状态变更 | MQTT | 终端每次操作后通过 retained 消息上报状态 |

### 1.4 消息格式

**MQTT 与 UDP 的 payload 格式不同**：MQTT 主题本身携带路由信息，payload 为纯业务 JSON；UDP 需在 payload 中内嵌 topic。

#### MQTT 控制指令（客户端 → Broker → 终端）

Topic: `YHHome/RC/bedroomAC`
Payload:

```json
{"action":"togglePower"}
{"action":"setOnTimer","params":{"minutes":60}}
```

#### MQTT 状态消息（终端 → Broker → 客户端，retained）

Topic: `YHHome/device/bedroomAC`
Payload:

```json
{"power":true,"mode":"cool","temperature":26,"swing":false,"windSpeed":"auto","gentle":false,"light":true,"onTimer":0,"offTimer":0}
```

#### UDP 消息（同一端口多 Topic）

```json
{"topic":"YHHome/RC/bedroomAC","data":{"action":"togglePower"}}
{"topic":"YHHome/device/bedroomAC","data":{"power":true,"mode":"cool","temperature":26,...}}
```

### 1.5 对外 API

```kotlin
// 获取单例
val ac = BedroomAC.getInstance()

// ── 属性 ──
val state: ACState = ac.currentState

// ── 状态回调 ──
ac.addCallback(callback: ACStateCallback)
ac.removeCallback(callback: ACStateCallback)

// ── 基本操作 ──
ac.togglePower()            // 切换电源
ac.increaseTemperature()    // 温度 +1（上限 30°C）
ac.decreaseTemperature()    // 温度 -1（下限 16°C）
ac.toggleSwing()            // 切换摆风
ac.setCoolingMode()         // 制冷模式
ac.setHeatingMode()         // 制热模式
ac.setDryMode()             // 除湿模式
ac.setFanMode()             // 送风模式
ac.toggleWindSpeed()        // 循环风速（自动→低→中→高→自动）
ac.enableGentleMode()       // 舒风模式
ac.toggleLight()            // 切换机身屏显

// ── 定时操作 ──
ac.setOnTimer(minutes: Int)   // 定时开机（分钟，步长 20，最大 720）
ac.setOffTimer(minutes: Int)  // 定时关机（分钟，步长 20，最大 720）
ac.cancelOnTimer()            // 取消定时开机
ac.cancelOffTimer()           // 取消定时关机
```

### 1.6 依赖

无额外第三方依赖，依赖 `mqtt` 与 `udp` 模块。

---

## 2. 运行流程图

### 2.1 发送控制指令

```
调用方                    BedroomAC              UdpManager          MqttManager
  │                            │                      │                    │
  │ ① togglePower()            │                      │                    │
  │                            ├─ 查找本地在线 AC       │                    │
  │                            │  udp.deviceList       │                    │
  │                            │  .find { deviceType   │                    │
  │                            │    == "bedroomAC"}    │                    │
  │                            │    │                  │                    │
  │                            │    ├─ 找到 → ②          │                    │
  │                            │    │  udp.publish(     │                    │
  │                            │    │    TOPIC_RC,      │                    │
  │                            │    │    {action},      │                    │
  │                            │    │    targetIp) ────→ 单播到设备 IP      │
  │                            │    │                  │                    │
  │                            │    └─ 未找到 → ③       │                    │
  │                            │       mqtt.publish(   │                    │
  │                            │         TOPIC_RC,     │                    │
  │                            │         actionJson) ──────────────────────→ Broker → ESP8266
```

### 2.2 接收状态变更

```
ESP8266 终端                 MQTT Broker                  BedroomAC
  │                              │                            │
  │ 操作完成                      │                            │
  │ _notifyState()               │                            │
  │ mqtt.publish(                │                            │
  │   TOPIC_DEVICE_BEDROOM_AC,   │                            │
  │   stateJson, retained=true)  │                            │
  │ ──────────────────────────→  │                            │
  │                              ├─ messageArrived ──────────→
  │                              │  (已订阅该 topic)           │
  │                              │                           ├─ parse ACState
  │                              │                           ├─ 更新 state
  │                              │                           └─ callbacks.onStateChanged()
  │                              │                            │
  │                              │                    调用方 ← onStateChanged(state)
```

### 2.3 初始化

```
调用方                    BedroomAC                     MqttManager
  │                            │                            │
  │ ① getInstance()            │                            │
  │                            ├─ 首次调用 → init()          │
  │                            │  ├─ mqtt.subscribe(         │
  │                            │  │    TOPIC_DEVICE,         │
  │                            │  │    qos=0,                │
  │                            │  │    stateCallback) ──────→ 订阅 retained 状态
  │  ←─ 返回单例               │                            │
```

---

## 3. 模块关系图

### 3.1 内部结构

```
┌──────────────────────────────────────────────────────────────────┐
│              devices/bedroomAC/ 模块内部                         │
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
│  │ + setCoolingMode()│      └──────────────────┘                 │
│  │ + toggleWindSpeed│                                           │
│  │ + enableGentle() │       ┌──────────────────┐                 │
│  │ + toggleLight()  │  持有 │ ACState          │                 │
│  │ + setOnTimer()   │──────▶│  (当前状态)       │                 │
│  │ + cancelOnTimer()│       └──────────────────┘                 │
│  │ + addCallback()  │                                           │
│  │ + removeCallback()│      ┌──────────────────┐                 │
│  └──────────────────┘  持有 │ ACStateCallback   │                 │
│                           ─▶│  列表             │                 │
│                              └──────────────────┘                 │
│                                                                  │
│  ┌──────────────────┐                                            │
│  │ ACState          │  (public)                                  │
│  │ ─────────────────│                                            │
│  │ + power: Boolean │                                            │
│  │ + temperature: Int│                                           │
│  │ + mode: String   │                                            │
│  │ + swing: Boolean │                                            │
│  │ + windSpeed: String│                                          │
│  │ + gentle: Boolean│                                            │
│  │ + light: Boolean │                                            │
│  │ + onTimer: Int   │                                            │
│  │ + offTimer: Int  │                                            │
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
│   .setCoolingMode()         │
│   ...                       │
└──────────────────────────────┘
```

### 3.2 接口可见性

| 类 / 接口 | 可见性 | 说明 |
|-----------|--------|------|
| `BedroomAC` | public | 单例控制器，对外唯一入口 |
| `ACState` | public | 空调状态数据类 |
| `ACStateCallback` | public | 状态变更回调接口 |
| `BedroomACConfig` | internal | Topic 与设备类型常量 |

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
| `getInstance()` | `static fun` | 获取单例，首次调用自动订阅 MQTT 状态主题 |
| `currentState` | `val ACState` | 当前空调实时状态 |
| `addCallback(callback)` | `fun` | 注册状态变更回调，重复注册自动去重 |
| `removeCallback(callback)` | `fun` | 移除状态变更回调 |
| `togglePower()` | `fun` | 切换电源开关 |
| `increaseTemperature()` | `fun` | 温度 +1（上限 30） |
| `decreaseTemperature()` | `fun` | 温度 -1（下限 16） |
| `toggleSwing()` | `fun` | 切换摆风开关 |
| `setCoolingMode()` | `fun` | 制冷模式 |
| `setHeatingMode()` | `fun` | 制热模式 |
| `setDryMode()` | `fun` | 除湿模式 |
| `setFanMode()` | `fun` | 送风模式 |
| `toggleWindSpeed()` | `fun` | 循环切换风速（auto → low → medium → high → auto） |
| `enableGentleMode()` | `fun` | 舒风模式 |
| `toggleLight()` | `fun` | 切换机身屏显开关 |
| `setOnTimer(minutes)` | `fun` | 定时开机（分钟，步长 20，最大 720） |
| `setOffTimer(minutes)` | `fun` | 定时关机（分钟，步长 20，最大 720） |
| `cancelOnTimer()` | `fun` | 取消定时开机 |
| `cancelOffTimer()` | `fun` | 取消定时关机 |

#### ACState（状态数据类）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `power` | `Boolean` | `false` | 电源，`true` 开机 |
| `temperature` | `Int` | `26` | 设定温度，范围 16~30 |
| `mode` | `String` | `"cool"` | 模式：`"cool"` / `"heat"` / `"dry"` / `"fan"` |
| `swing` | `Boolean` | `false` | 摆风 |
| `windSpeed` | `String` | `"auto"` | 风速：`"auto"` / `"low"` / `"medium"` / `"high"` |
| `gentle` | `Boolean` | `false` | 舒风模式 |
| `light` | `Boolean` | `true` | 机身屏显，`true` 亮 |
| `onTimer` | `Int` | `0` | 定时开机（分钟），0=关闭，步长 20，最大 720 |
| `offTimer` | `Int` | `0` | 定时关机（分钟），0=关闭，步长 20，最大 720 |

> **注意**：ESP8266 终端使用 TCL112AC 红外协议，该协议不支持睡眠模式，因此 Android 端不再提供睡眠模式操作和状态字段。

#### ACStateCallback（状态回调接口）

| 方法 | 说明 |
|------|------|
| `onStateChanged(state: ACState)` | 状态变更时回调，携带最新完整状态。在主线程调用 |

#### BedroomACConfig（内部配置）

| 常量 | 类型 | 值 | 说明 |
|------|------|-----|------|
| `TOPIC_RC` | `String` | `"YHHome/RC/bedroomAC"` | 遥控指令 Topic |
| `TOPIC_DEVICE` | `String` | `"YHHome/device/bedroomAC"` | 设备状态 Topic（retained） |
| `DEVICE_TYPE` | `String` | `"bedroomAC"` | 设备类型标识 |

---

## 4. 目录结构

```
app/src/main/java/com/yuwjoo/myhome/modules/devices/bedroomAC/
├── DESIGN.md
├── ACState.kt
├── ACStateCallback.kt
├── BedroomACConfig.kt
└── BedroomAC.kt
```

| 文件 | 可见性 | 职责 |
|------|--------|------|
| `BedroomAC.kt` | public | 单例控制器，封装操作、状态管理、双通道收发 |
| `ACState.kt` | public | 空调状态数据类 |
| `ACStateCallback.kt` | public | 状态变更回调接口 |
| `BedroomACConfig.kt` | internal | Topic 与设备类型常量 |

---

## 5. 实现流程

### 5.1 步骤 1 — `ACState`、`ACStateCallback`、`BedroomACConfig`

```kotlin
package com.yuwjoo.myhome.modules.devices.bedroomAC

data class ACState(
    val power: Boolean = false,       // 电源
    val temperature: Int = 26,        // 设定温度 16~30
    val mode: String = "cool",        // "cool" | "heat" | "dry" | "fan"
    val swing: Boolean = false,       // 摆风
    val windSpeed: String = "auto",   // "auto" | "low" | "medium" | "high"
    val gentle: Boolean = false,      // 舒风
    val light: Boolean = true,        // 屏显
    val onTimer: Int = 0,             // 定时开机（分钟），0=关闭
    val offTimer: Int = 0,            // 定时关机（分钟），0=关闭
)
```

```kotlin
package com.yuwjoo.myhome.modules.devices.bedroomAC

interface ACStateCallback {
    /**
     * 空调状态发生变化
     * @param state 最新的完整状态
     */
    fun onStateChanged(state: ACState)
}
```

```kotlin
package com.yuwjoo.myhome.modules.devices.bedroomAC

internal object BedroomACConfig {
    const val TOPIC_RC = "YHHome/RC/bedroomAC"
    const val TOPIC_DEVICE = "YHHome/device/bedroomAC"
    const val DEVICE_TYPE = "bedroomAC"
}
```

### 5.2 步骤 2 — `BedroomAC`

```kotlin
package com.yuwjoo.myhome.modules.devices.bedroomAC

import android.os.Handler
import android.os.Looper
import com.yuwjoo.myhome.modules.mqtt.MqttManager
import com.yuwjoo.myhome.modules.mqtt.MqttTopicCallback
import com.yuwjoo.myhome.modules.udp.UdpManager
import com.yuwjoo.myhome.modules.udp.UdpTopicCallback
import org.json.JSONObject

class BedroomAC private constructor() {

    companion object {
        private val _instance: BedroomAC by lazy { BedroomAC().also { it.init() } }

        fun getInstance(): BedroomAC = _instance
    }

    private val callbacks = mutableListOf<ACStateCallback>()
    private var state = ACState()
    private val handler = Handler(Looper.getMainLooper())
    private var initialized = false

    val currentState: ACState
        get() = state

    private fun init() {
        if (initialized) return
        initialized = true

        // 订阅 MQTT 设备状态主题（retained 消息，QoS 0 即可）
        MqttManager.getInstance().subscribe(
            topic = BedroomACConfig.TOPIC_DEVICE,
            qos = 0,
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

    fun addCallback(callback: ACStateCallback) {
        if (!callbacks.contains(callback)) {
            callbacks.add(callback)
        }
    }

    fun removeCallback(callback: ACStateCallback) {
        callbacks.remove(callback)
    }

    // ── 基本操作 ──

    fun togglePower()          = sendCommand("togglePower")
    fun increaseTemperature()  = sendCommand("increaseTemperature")
    fun decreaseTemperature()  = sendCommand("decreaseTemperature")
    fun toggleSwing()          = sendCommand("toggleSwing")
    fun setCoolingMode()       = sendCommand("setCoolingMode")
    fun setHeatingMode()       = sendCommand("setHeatingMode")
    fun setDryMode()           = sendCommand("setDryMode")
    fun setFanMode()           = sendCommand("setFanMode")
    fun toggleWindSpeed()      = sendCommand("toggleWindSpeed")
    fun enableGentleMode()     = sendCommand("enableGentleMode")
    fun toggleLight()          = sendCommand("toggleLight")

    // ── 定时操作 ──

    fun setOnTimer(minutes: Int) {
        val params = JSONObject().apply { put("minutes", minutes.coerceIn(0, 720)) }
        sendCommand("setOnTimer", params)
    }

    fun setOffTimer(minutes: Int) {
        val params = JSONObject().apply { put("minutes", minutes.coerceIn(0, 720)) }
        sendCommand("setOffTimer", params)
    }

    fun cancelOnTimer()  = sendCommand("cancelOnTimer")
    fun cancelOffTimer() = sendCommand("cancelOffTimer")

    // ── 消息收发 ──

    private fun sendCommand(action: String, params: JSONObject? = null) {
        // MQTT payload 格式：{"action":"togglePower","params":{...}}
        // UDP 需包装为：{"topic":"YHHome/RC/bedroomAC","data":{"action":"...","params":{...}}}
        val actionJson = JSONObject().apply {
            put("action", action)
            if (params != null) put("params", params)
        }

        val acDevice = UdpManager.getInstance().deviceList
            .find { it.deviceType == BedroomACConfig.DEVICE_TYPE }

        if (acDevice != null) {
            UdpManager.getInstance().publish(
                topic = BedroomACConfig.TOPIC_RC,
                payload = actionJson,
                targetIp = acDevice.ipAddress,
            )
        } else {
            MqttManager.getInstance().publish(
                topic = BedroomACConfig.TOPIC_RC,
                payload = actionJson.toString(),
                qos = 1,
            )
        }
    }

    // ── 状态解析 ──

    /**
     * 解析 MQTT 收到的 retained 状态 JSON
     * 格式：{"power":true,"mode":"cool","temperature":26,...}
     */
    private fun applyStateFromJson(jsonStr: String) {
        try {
            applyStateFromPayload(JSONObject(jsonStr))
        } catch (_: Exception) { }
    }

    /**
     * 解析 UDP 收到的状态 payload
     * UDP 格式：{"topic":"...","data":{"power":true,...}}
     * 需要先提取 data 字段
     */
    private fun applyStateFromPayload(payload: Any?) {
        val json = when (payload) {
            is JSONObject -> {
                // UDP 包装格式：有 data 字段则解包
                if (payload.has("data")) payload.getJSONObject("data") else payload
            }
            is String -> try { JSONObject(payload) } catch (_: Exception) { null }
            else -> null
        } ?: return

        val newState = ACState(
            power       = json.optBoolean("power", state.power),
            temperature = json.optInt("temperature", state.temperature),
            mode        = json.optString("mode", state.mode),
            swing       = json.optBoolean("swing", state.swing),
            windSpeed   = json.optString("windSpeed", state.windSpeed),
            gentle      = json.optBoolean("gentle", state.gentle),
            light       = json.optBoolean("light", state.light),
            onTimer     = json.optInt("onTimer", state.onTimer),
            offTimer    = json.optInt("offTimer", state.offTimer),
        )

        if (newState != state) {
            state = newState
            handler.post {
                callbacks.forEach { it.onStateChanged(state) }
            }
        }
    }
}
```

### 5.3 步骤 3 — 使用示例

```kotlin
class BedroomACActivity : AppCompatActivity() {

    private val stateCallback = object : ACStateCallback {
        override fun onStateChanged(state: ACState) {
            binding.tvTemperature.text = "${state.temperature}°C"
            binding.swPower.isChecked = state.power
            binding.tvMode.text = when (state.mode) {
                "cool" -> "制冷"
                "heat" -> "制热"
                "dry"  -> "除湿"
                "fan"  -> "送风"
                else   -> state.mode
            }
            binding.swLight.isChecked = state.light
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val ac = BedroomAC.getInstance()
        ac.addCallback(stateCallback)
        updateUI(ac.currentState)

        binding.btnPower.setOnClickListener { ac.togglePower() }
        binding.btnTempUp.setOnClickListener { ac.increaseTemperature() }
        binding.btnTempDown.setOnClickListener { ac.decreaseTemperature() }
        binding.btnCool.setOnClickListener { ac.setCoolingMode() }
        binding.btnHeat.setOnClickListener { ac.setHeatingMode() }
        binding.btnSwing.setOnClickListener { ac.toggleSwing() }
        binding.btnWindSpeed.setOnClickListener { ac.toggleWindSpeed() }
        binding.btnLight.setOnClickListener { ac.toggleLight() }
        binding.btnOnTimer.setOnClickListener { ac.setOnTimer(60) }
        binding.btnCancelOnTimer.setOnClickListener { ac.cancelOnTimer() }
    }

    override fun onDestroy() {
        super.onDestroy()
        BedroomAC.getInstance().removeCallback(stateCallback)
    }

    private fun updateUI(state: ACState) { /* ... */ }
}

// 任意位置操作
BedroomAC.getInstance().togglePower()
BedroomAC.getInstance().setCoolingMode()
BedroomAC.getInstance().setOffTimer(minutes = 120)
```
