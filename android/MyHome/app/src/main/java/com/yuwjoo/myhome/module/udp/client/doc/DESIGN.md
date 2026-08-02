# UDP Client 架构设计

## 架构目录

```
udp/client/
│
├── UdpClient.kt                  # 门面：对外唯一入口，装配组件 + 编排生命周期
│
├── config/                       # 配置
│   ├── LocalConfig.kt            #   本机设备配置（名称/能力/心跳间隔/能力前缀）
│   ├── FrameConfig.kt            #   帧协议配置（MAGIC/HEADER_SIZE/Type/Flags/ACK_PAYLOAD_SIZE）
│   └── NetConfig.kt              #   网络配置（组播/广播地址/端口/缓冲区/hostId 工具）
│
├── router/                       # 路由 + 全部接收侧消息处理
│   ├── MessageRouter.kt          #   帧类型 when 分发入口，不含业务逻辑
│   ├── HeartbeatHandler.kt       #   处理 HEARTBEAT 帧：记录心跳 + 未知设备触发握手
│   ├── HandshakeHandler.kt       #   处理 CALL/ANSWER 帧：注册设备 + 初始化序号 + 回复
│   ├── OfflineHandler.kt         #   处理 OFFLINE 帧：标记设备离线
│   ├── AckHandler.kt             #   处理 ACK 帧：解析 payload + 通知 AckEngine
│   └── OrderedMsgHandler.kt      #   处理有序消息帧：序号校验 + 接受/丢弃 + 回复 ACK
│
├── engine/                       # 主动引擎
│   ├── AckEngine.kt              #   有序发送：入队 + 序号分配 + ACK 等待 + 退避重试
│   └── HeartbeatEngine.kt        #   定时广播心跳 + 超时离线检测
│
├── codec/                        # 协议编解码
│   ├── FrameCodec.kt             #   帧编解码 + CRC16 校验
│   └── PayloadCodec.kt           #   DeviceInfo JSON + ACK payload 序列化/反序列化
│
├── transport/                    # IO 基础设施
│   ├── UdpSocket.kt              #   Socket 生命周期 + 单播/广播发送 + 原始接收
│   ├── SocketReader.kt           #   协程接收循环 + 自收过滤 + 解码后回调
│   └── NetworkMonitor.kt         #   WiFi 监听 + 防抖
│
├── device/                       # 设备管理
│   ├── DeviceRegistry.kt         #   设备 CRUD + 在线/离线状态管理 + 回调
│   └── SeqManager.kt             #   每设备收发序号 + uint16 回绕 + 消费校验
│
└── model/                        # 数据模型
    ├── RetryPolicy.kt            #   ACK 重试的指数退避时间计算
    ├── FrameData.kt              #   帧模型（type/seqNum/flags/payload + isOrdered）
    ├── LanDevice.kt              #   设备模型（ip/name/abilities/online）
    └── DeviceInfo.kt             #   握手信息模型
```

## 依赖关系

```
UdpClient（门面）
 │
 ├─→ 消息路由（MessageRouter + Handler）  ← 收包解码后，按帧类型分发到各 Handler
 │    │
 │    ├─→ 心跳引擎（HeartbeatEngine）     ← HeartbeatHandler 调用
 │    │    ├─→ 设备管理（DeviceRegistry）
 │    │    └─→ 网络IO（UdpSocket）
 │    │
 │    ├─→ 可靠传输引擎（AckEngine）       ← AckHandler + OrderedMsgHandler 调用
 │    │    ├─→ 设备管理（SeqManager）
 │    │    ├─→ 协议编解码（FrameCodec）
 │    │    └─→ 网络IO（UdpSocket）
 │    │
 │    ├─→ 设备管理（DeviceRegistry）       ← HandshakeHandler + OfflineHandler 调用
 │    ├─→ 协议编解码（FrameCodec）        ← 收发帧编解码
 │    └─→ 网络IO（UdpSocket）            ← 回复帧发送
 │
 ├─→ 心跳引擎（HeartbeatEngine）          ← 定时广播心跳 + 超时离线检测
 │    ├─→ 设备管理（DeviceRegistry）
 │    └─→ 网络IO（UdpSocket）
 │
 ├─→ 可靠传输引擎（AckEngine）            ← 有序消息入队发送 + ACK 等待 + 退避重试
 │    ├─→ 设备管理（SeqManager）
 │    ├─→ 协议编解码（FrameCodec）
 │    └─→ 网络IO（UdpSocket）
 │
 ├─→ 网络监听（NetworkMonitor）           ← WiFi 变化时回调门面重建连接
 │
 └─→ 网络IO（UdpSocket + SocketReader）   ← 原始字节收发
```

各模块自顶向下单向依赖，无循环引用。设计核心为**收发分离**：

- **接收管线**：网络IO → 协议编解码 → 消息路由分配 → 各 Handler 修改状态 / 通知引擎 / 回调上层
- **发送管线**：心跳引擎 / 可靠传输引擎 / 门面直发 → 协议编解码 → 网络IO
