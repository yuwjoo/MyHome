# MyHome Android 项目设计文档

> 项目根包：`com.yuwjoo.myhome`

---

## 一、目录结构

```
com.yuwjoo.myhome/
│
├── MyApplication.kt                     # Application 入口，初始化 MQTT 并连接
├── MainActivity.kt                      # 唯一 Activity，承载 WebView 容器
├── DESIGN.md                            # 本文件
│
├── config/                              # 全局配置层
│   ├── AppConfig.kt                     # 应用配置（URL、路径、环境、FileProvider）
│   └── MqttTopics.kt                   # MQTT 主题统一定义
│
├── ui/                                  # UI 层
│   ├── DialogHelper.kt                  # 对话框工具（更新进度、下载提示、错误弹窗）
│   └── webview/                         # WebView 容器子模块
│       ├── WebViewManager.kt            # WebView 创建、配置、生命周期管理
│       ├── LocalWebResourceInterceptor.kt  # 拦截请求，映射到本地文件（正式环境）
│       └── WebResourceManager.kt        # 本地 Web 资源文件读写、版本管理
│
└── module/                              # 业务模块层
    ├── bridge/                          # Native ↔ Web 通信桥接
    ├── mqtt/                            # MQTT 通信模块（单例）
    ├── udp/                             # UDP 局域网通信模块（单例）
    ├── update/                          # OTA 热更新模块
    └── device/                          # 设备层（状态订阅 + 命令下发）
        ├── bedroomAC/                   # 卧室空调
        ├── tempHumid/                   # 温湿度传感器
        └── deviceStatus/                # 设备在线状态
```
