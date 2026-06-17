# ESP8266 NodeMCU 智能家居节点

> 基于 ESP8266 NodeMCU，实现 WiFi 联网、MQTT 通信、DHT11 温湿度采集、红外空调控制。

## 硬件清单

| 硬件 | 数量 | 连接引脚 |
|------|------|----------|
| ESP8266 NodeMCU | 1 | — |
| DHT11 温湿度传感器 | 1 | Data → D4 (GPIO2) |
| 红外发射管 + 限流电阻 (100Ω) | 1 | 正极 → D3 (GPIO0)，负极 → GND |

## 功能说明

1. **WiFi 联网** — 根据 Config.h 中配置的 SSID/密码连接局域网
2. **MQTT 通信** — 连接 MQTT Broker，发布传感器保留消息，订阅控制指令
3. **DHT11 温湿度采集** — 按可配置间隔读取温湿度，通过 MQTT 保留消息上报
4. **红外空调控制** — 监听 MQTT 遥控指令，BedroomAC 模块路由到对应红外编码并发射

## 目录结构

```
nodeMCU/
├── nodeMCU.ino           # 主程序入口（setup/loop/MQTT回调）
├── Config.h              # 集中配置文件（WiFi/MQTT/引脚/间隔/缓冲区）
├── MessageDto.h          # 消息结构定义（TempHumidMessage, RemoteCommand, ACStateMessage）
├── WiFiManager.h/.cpp    # WiFi 连接模块
├── MqttManager.h/.cpp    # MQTT 连接与消息模块
├── DhtSensor.h/.cpp      # DHT11 温湿度传感器模块
├── IrTransmitter.h/.cpp  # 红外发射模块（纯底层，仅发射信号）
├── BedroomAC.h/.cpp      # 卧室空调遥控器模块（红外编码 + 按键逻辑）
└── README.md             # 本文件
```

## 模块层次

```
┌──────────────────────────────────────────┐
│  nodeMCU.ino                             │  ← 主程序：组装各模块，处理 MQTT 回调
│  - onMqttMessage() 解析 JSON → action    │
│  - 注册 AC 状态回调，自动发布保留消息     │
└──────────────────┬───────────────────────┘
                   │ handleAction("togglePower")
                   ▼
┌──────────────────────────────────────────┐
│  BedroomAC                               │  ← 业务层：存储红外编码，实现按键方法
│  - togglePower()                         │     action → 匹配编码 → 调用 IrTransmitter
│  - setCoolingMode()   ...                │     → 更新本地状态 → _notifyState() 回调
│  - handleAction(action, params)          │
└──────────────────┬───────────────────────┘
                   │ sendRaw(data, length)
                   ▼
┌──────────────────────────────────────────┐
│  IrTransmitter                           │  ← 硬件层：纯红外信号发射
│  - sendRaw(rawData, length)              │     不包含任何空调业务逻辑
└──────────────────────────────────────────┘
```

## 依赖库

在 Arduino IDE 库管理器（Ctrl+Shift+I）中搜索并安装：

| 库名 | 作者 | 用途 |
|------|------|------|
| PubSubClient | Nick O'Leary | MQTT 客户端 |
| SimpleDHT | winlin | DHT11 传感器驱动 |
| IRremoteESP8266 | David Conran | 红外发射 |
| ArduinoJson | Benoit Blanchon | JSON 序列化/反序列化 |

## 使用步骤

### 1. 修改配置

打开 `Config.h`，修改 WiFi 和 MQTT 连接信息：

```cpp
const char *WIFI_SSID = "你的WiFi名称";
const char *WIFI_PASSWORD = "你的WiFi密码";
const char *MQTT_BROKER = "192.168.1.100";
const char *MQTT_PASSWORD = "你的MQTT密码";
const unsigned long DHT_REPORT_INTERVAL = 60000;  // 上报间隔，默认 60 秒
```

### 2. 配置红外编码（重要）

`BedroomAC.cpp` 中每个按键的 `RAW_*` 数组是示例占位值，**必须替换为实际空调遥控器的红外编码**。

获取真实编码：
1. 打开 IRremoteESP8266 示例 `IRrecvDumpV2`
2. 烧录到另一块 ESP8266（或本板临时切换）
3. 对准红外接收管按下遥控器按键
4. 从串口监视器复制输出的 `uint16_t rawData[]` 数组
5. 粘贴到 `BedroomAC.cpp` 对应按键的 `RAW_*` 数组中

### 3. 烧录程序

1. 在 Arduino IDE 中打开 `nodeMCU/` 文件夹
2. 选择开发板：工具 → 开发板 → ESP8266 Boards → NodeMCU 1.0
3. 选择端口：工具 → 端口 → 对应的 COM 口
4. 点击上传

### 4. 验证

打开串口监视器（115200 波特率），正常启动输出：

```
=========================================
  智能家居 ESP8266 节点启动
  Client ID: esp8266-nodemcu
=========================================
[WiFi] 正在连接: MyWiFi
[WiFi] 连接成功！IP: 192.168.1.101
[MQTT] 正在连接 Broker: 192.168.1.100:1883
[MQTT] 连接成功！
[MQTT] 已订阅: YHHome/RC/bedroomAC
[DHT11] 传感器已就绪
[IR] 红外发射模块已就绪（引脚: 0）
[BedroomAC] 空调遥控器模块已就绪
[BedroomAC] 初始状态: {"power":false,"mode":"cool","temperature":26,"swing":false,"windSpeed":"auto","sleep":false,"gentle":false}
[MQTT] AC 状态已上报(保留): {"power":false,"mode":"cool","temperature":26,"swing":false,"windSpeed":"auto","sleep":false,"gentle":false}
[系统] 初始化完成
[DHT11] 温度: 26°C, 湿度: 58%
[MQTT] 已发布(保留) → YHHome/sensor/tempHumid: {"temperature":26.0,"humidity":58.0}
```

收到遥控指令时：
```
[MQTT] 收到消息 | topic: YHHome/RC/bedroomAC | payload: {"action":"togglePower"}
[控制] 收到指令: togglePower
[BedroomAC] 开关机
[IR] 正在发射红外信号（68 个脉冲）...
[IR] 发射完成
[BedroomAC] 电源 → 开
[MQTT] AC 状态已上报(保留): {"power":true,"mode":"cool","temperature":26,"swing":false,"windSpeed":"auto","sleep":false,"gentle":false}
```

## MQTT 主题说明

| 主题 | 方向 | 保留 | 用途 | 消息格式 |
|------|------|------|------|----------|
| `YHHome/sensor/tempHumid` | ESP → App | ✅ | 温湿度上报 | `{"temperature":26.0,"humidity":58.0}` |
| `YHHome/RC/bedroomAC` | App → ESP | ❌ | 遥控指令 | `{"action":"togglePower"}` |
| `YHHome/device/bedroomAC` | ESP → App | ✅ | AC 状态上报 | `{"power":true,"mode":"cool","temperature":26,"swing":false,"windSpeed":"auto","sleep":false,"gentle":false}` |
| `device/offline` | Broker 自动 | ✅ | 遗嘱消息 | `{"status":"offline"}` |

## 支持的遥控指令

| action | 说明 | 编码位置 (BedroomAC.cpp) |
|--------|------|--------------------------|
| `togglePower` | 开关机 | `RAW_TOGGLE_POWER` |
| `increaseTemperature` | 温度 +1 | `RAW_INCREASE_TEMP` |
| `decreaseTemperature` | 温度 -1 | `RAW_DECREASE_TEMP` |
| `toggleSwing` | 切换摆风 | `RAW_TOGGLE_SWING` |
| `setCoolingMode` | 制冷模式 | `RAW_COOLING_MODE` |
| `setHeatingMode` | 制热模式 | `RAW_HEATING_MODE` |
| `setDryMode` | 除湿模式 | `RAW_DRY_MODE` |
| `setFanMode` | 送风模式 | `RAW_FAN_MODE` |
| `toggleWindSpeed` | 风速切换 | `RAW_TOGGLE_WIND_SPEED` |
| `enableGentleMode` | 舒风模式 | `RAW_GENTLE_MODE` |
| `toggleSleepMode` | 睡眠模式 | `RAW_TOGGLE_SLEEP` |

添加新指令步骤：
1. 在 `BedroomAC.h` 的 private 区声明 `RAW_*` 静态数组和长度
2. 在 `BedroomAC.cpp` 中定义数组（填入红外编码）
3. 在 `.h` public 区声明对应按钮方法
4. 在 `.cpp` 中实现方法（调用 `_ir.sendRaw()`）
5. 在 `handleAction()` 中添加新的 `if` 分支

## 与 Android App 的关系

```
┌─────────────┐     MQTT      ┌─────────────┐     WiFi      ┌──────────────┐
│ Android App  │ ←─────────── │ MQTT Broker  │ ←─────────── │ ESP8266 节点  │
│ (BedroomAC)  │ ────────────→│              │ ────────────→│ (nodeMCU)    │
│              │   控制指令     │ 192.168.1.100│   上报数据     │              │
└─────────────┘               └─────────────┘               └──────────────┘
                                      │                              │
                                      │                    ┌─────────┴─────────┐
                                      │                    │ BedroomAC         │
                                      │                    │  → IrTransmitter   │
                                      │                    │ DhtSensor          │
                                      │                    └───────────────────┘
                                      │                              │
                                      ▼                              ▼
                               MQTT 主题                        GPIO 引脚
                          YHHome/RC/bedroomAC              D3(IR)  D4(DHT11)
                          YHHome/sensor/tempHumid
```
