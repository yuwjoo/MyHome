#ifndef CONFIG_H
#define CONFIG_H

// ============================================================
//  集中配置文件
//  描述：所有可配置参数集中于此，修改后无需查找其他文件。
//  硬件：ESP8266 NodeMCU + DHT11 + 红外发射管
// ============================================================

// ──────────────────────────────────
//  WiFi 网络配置
// ──────────────────────────────────
const char *const WIFI_SSID = "yuwjoo";     // WiFi 名称
const char *const WIFI_PASSWORD = "17136375393";  // WiFi 密码

// ──────────────────────────────────
//  MQTT Broker 配置
// ──────────────────────────────────
const char *const MQTT_BROKER = "47.115.161.79";       // Broker IP 地址
const int MQTT_PORT = 1883;                             // Broker 端口
const char *const MQTT_USERNAME = "myhome";             // 用户名
const char *const MQTT_PASSWORD = "your_mqtt_password"; // 密码
const char *const MQTT_CLIENT_ID = "esp8266-nodemcu";   // 客户端 ID（需唯一）

// MQTT 遗嘱消息：设备离线时 Broker 自动发布
// 设备重新上线时会主动发布在线消息覆盖，避免遗留离线状态
const char *const MQTT_WILL_TOPIC = "YHome/data/ESP8266";
const char *const MQTT_WILL_PAYLOAD = R"({"isOnline":false,"updateTime":0})";

// ──────────────────────────────────
//  Topic 定义
// ──────────────────────────────────
// 监听：接收遥控指令（来自 Android App）
const char *const TOPIC_RC_BEDROOM_AC = "YHome/cmd/bedroomAC";

// 发布：温湿度传感器数据（保留消息，新订阅者立即可获取最新值）
const char *const TOPIC_SENSOR_TEMP_HUMID = "YHome/data/tempHumidSensor";

// 发布：空调当前状态（保留消息，每次操作后更新）
const char *const TOPIC_DEVICE_BEDROOM_AC = "YHome/data/bedroomAC";

// ──────────────────────────────────
//  DHT11 温湿度传感器配置
// ──────────────────────────────────
const int DHT_PIN = D5;                           // 数据引脚（NodeMCU D4 = GPIO2）
const unsigned long DHT_REPORT_INTERVAL = 10000;  // 上报间隔（毫秒），默认 60 秒
const bool DHT_REPORT_RETAINED = true;            // 是否保留消息

// ──────────────────────────────────
//  红外发射模块配置
// ──────────────────────────────────
const int IR_LED_PIN = D2;                        // 红外发射引脚（NodeMCU D3 = GPIO0）

// ──────────────────────────────────
//  ArduinoJson 缓冲区尺寸
// ──────────────────────────────────
// StaticJsonDocument 在栈上分配，需根据消息结构预估最大 JSON 长度
const size_t JSON_DOC_SIZE_TEMP_HUMID = 64;     // TempHumidMessage {"temperature":26.0,"humidity":58.0}
const size_t JSON_DOC_SIZE_RC = 128;            // RemoteCommand {"action":"setCoolingMode","params":{...}}
const size_t JSON_DOC_SIZE_AC_STATE = 256;      // ACStateMessage 含定时器字段

// ──────────────────────────────────
//  系统配置
// ──────────────────────────────────
const unsigned long WIFI_RETRY_INTERVAL = 500;    // WiFi 连接失败重试间隔（毫秒）
const unsigned long MQTT_RETRY_INTERVAL = 5000;   // MQTT 连接失败重试间隔（毫秒）
const unsigned long LOOP_DELAY = 10;              // 主循环间隔（毫秒）

#endif  // CONFIG_H
