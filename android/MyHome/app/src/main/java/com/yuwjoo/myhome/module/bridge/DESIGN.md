# NativeBridge 设计

> 核心流程：**Web 消息 → BridgeRouter（路由） → ActionHandler / EventHandler（业务处理）**

Web 消息分为两类，对应不同的原生调用入口：

| 消息类型 | Web 调用 | 原生入口 | 路由到 |
|----------|----------|----------|--------|
| **动作（命令）** | `bridge.send(name, params)` | `NativeHost.dispatch(json)` | `ActionHandler.execute()` |
| **事件（监听）** | `bridge.on(event, fn)` / `bridge.off(event, fn)` | `NativeHost.watch(json)` / `NativeHost.unwatch(json)` | `EventHandler.activate()` / `EventHandler.deactivate()` |

---

## 类图

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              module/bridge/  路由层 + 框架层                            │
│                                                                                      │
│  入口                                                                                 │
│  ═══                                                                                 │
│  ┌───────────────────────────────┐                                                   │
│  │  NativeHost                   │  @JavascriptInterface                             │
│  │  ─────────────────────        │  window.__nativeHost                              │
│  │  + platform(): String         │                                                   │
│  │  + dispatch(json): void       │──→ 动作 入口                                       │
│  │  + watch(json): void          │──→ 事件 入口（注册监听）                             │
│  │  + unwatch(json): void        │──→ 事件 入口（注销监听）                             │
│  └───┬──────────┬──────────┬────┘                                                   │
│      │dispatch  │ watch    │ unwatch                                                │
│      ▼          ▼          ▼                                                         │
│  路由                                                                                 │
│  ═══                                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐                     │
│  │  BridgeRouter                                                │                     │
│  │  ────────────────────                                        │                     │
│  │  - actions: Map<String, ActionHandler>                       │                     │
│  │  - eventManager: EventManager                                │                     │
│  │  ────────────────────                                        │                     │
│  │  + routeAction(name, params, groupId)  ← dispatch() 入口     │                     │
│  │  + routeWatch(event)                   ← watch() 入口        │                     │
│  │  + routeUnwatch(event)                 ← unwatch() 入口      │                     │
│  └──────┬──────────────────────┬────────────────────────────────┘                    │
│         │ routeAction()        │ routeWatch() / routeUnwatch()                       │
│         ▼                      ▼                                                      │
│  框架层                                                                               │
│  ══════                                                                              │
│  ┌──────────────────────┐   ┌────────────────────────────────────────────┐           │
│  │  «interface»         │   │  EventManager                              │           │
│  │  ActionHandler       │   │  ──────────────────                         │           │
│  │  + name: String      │   │  - watchCount: Map<String, Int>             │           │
│  │  + execute(params,   │   │  - providers: Map<String, EventHandler>     │           │
│  │    groupId, bridge)  │   │  ──────────────────                         │           │
│  └──────────────────────┘   │  + watch(event)                            │           │
│                              │  + unwatch(event)                         │           │
│  ┌──────────────────────┐   │  + register(provider)                      │           │
│  │  WebBridge            │   │  # onFirstWatch(event)  ← count 0→1        │           │
│  │  + emit(event, data)  │◄──│  # onLastWatch(event)   ← count 1→0        │           │
│  │  + reply(groupId,     │   └──────────┬─────────────────────────────────┘           │
│  │    event, data)       │              │ 管理                                       │
│  └──────────────────────┘              ▼                                              │
│                              ┌──────────────────────┐                                │
│                              │  «interface»         │                                │
│                              │  EventHandler        │                                │
│                              │  + events: Set<String>                               │
│                              │  + activate(bridge)  │  框架层接口                      │
│                              │  + deactivate()      │                                │
│                              └──────────┬───────────┘                                │
│                                         │ 实现                                        │
└─────────────────────────────────────────┼────────────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              common/bridge/  业务处理层                                 │
│                                                                                      │
│  动作处理（ActionHandler 实现）                                                         │
│  ═══════════════════════                                                              │
│  ┌──────────────────────────┐   ┌──────────────────────────┐                         │
│  │  BedroomACActionHandler  │   │  TempHumidActionHandler  │                         │
│  │  name = "bedroomAC"      │   │  name = "tempHumid"      │                         │
│  │                          │   │                          │                         │
│  │  execute() → when {      │   │  execute() → when {      │                         │
│  │    togglePower  → ...    │   │    getState     → ...    │                         │
│  │    increaseTemp → ...    │   │  }                        │                         │
│  │    setOnTimer   → ...    │   └──────────────────────────┘                         │
│  │    getState     → ...    │                                                         │
│  │  }                       │   ┌──────────────────────────┐                         │
│  └──────────────────────────┘   │  ESP8266ActionHandler    │                         │
│                                  │  name = "deviceStatus"  │                         │
│                                  │                          │                         │
│                                  │  execute() → when {     │                         │
│                                  │    getStatus → ...      │                         │
│                                  │  }                       │                         │
│                                  └──────────────────────────┘                         │
│                                                                                      │
│  事件处理（EventHandler 实现）                                                           │
│  ═══════════════════════                                                              │
│  ┌──────────────────────────┐   ┌──────────────────────────┐                         │
│  │  BedroomACEventHandler   │   │  TempHumidEventHandler   │                         │
│  │  ─────────────────       │   │  ─────────────────       │                         │
│  │  events = {              │   │  events = {              │                         │
│  │    "onACStateChanged"    │   │    "onTempHumidChanged"  │                         │
│  │  }                       │   │  }                       │                         │
│  │                          │   │                          │                         │
│  │  activate():             │   │  activate():             │                         │
│  │    注册设备回调 + 订阅主题 │   │    注册传感器回调 + 订阅主题│                         │
│  │                          │   │                          │                         │
│  │  deactivate():           │   │  deactivate():           │                         │
│  │    注销回调 + 取消订阅    │   │    注销回调 + 取消订阅    │                         │
│  └──────────────────────────┘   └──────────────────────────┘                         │
│                                                                                      │
│  ┌──────────────────────────┐                                                         │
│  │  ESP8266EventHandler     │                                                         │
│  │  ─────────────────       │                                                         │
│  │  events = {              │                                                         │
│  │    "onDeviceStatusChanged"│                                                        │
│  │  }                       │                                                         │
│  │  activate() / deactivate()│                                                        │
│  └──────────────────────────┘                                                         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

## 关联关系

```
Web 前端
  │
  ├──── bridge.send(name, params) ────→ NativeHost.dispatch()
  │                                          │
  │                                          ▼
  │                                     BridgeRouter.routeAction()
  │                                          │
  │                                          ▼ name 匹配
  │                                     ActionHandler.execute()
  │                                     (BedroomACActionHandler / TempHumidActionHandler / ESP8266ActionHandler)
  │
  ├──── bridge.on(event, fn) ──────────→ NativeHost.watch()
  │                                          │
  │                                          ▼
  │                                     BridgeRouter.routeWatch()
  │                                          │
  │                                          ▼
  │                                     EventManager.watch()
  │                                          │
  │                                          ├─ count: 0 → 1 → onFirstWatch()
  │                                          │   └─ EventHandler.activate()
  │                                          │      (BedroomACEventHandler / TempHumidEventHandler / ESP8266EventHandler)
  │                                          │
  │                                          └─ 数据变更时 → WebBridge.emit() → Web
  │
  └──── bridge.off(event, fn) ─────────→ NativeHost.unwatch()
                                             │
                                             ▼
                                        BridgeRouter.routeUnwatch()
                                             │
                                             ▼
                                        EventManager.unwatch()
                                             │
                                             └─ count: 1 → 0 → onLastWatch()
                                                 └─ EventHandler.deactivate()
```

## 命名映射

### 类

| 旧名 | 新名 | 说明 |
|------|------|------|
| `AppMessageHandler` | `BridgeRouter` | 路由分发 |
| `MessageAction` | `ActionHandler` | 动作处理接口 |
| `EventProvider` | `EventHandler` | 事件处理接口 |
| `EventRegistry` | `EventManager` | 事件注册管理 |
| `WebViewHelper` | `WebBridge` | Web 通信桥 |
| `NativeMessageHandler` | ~~删除~~ | 合并到 BridgeRouter |

### 方法 / 变量

| 旧名 | 新名 | 所在类 | 说明 |
|------|------|--------|------|
| `call(json)` | `dispatch(json)` | NativeHost | 分发动作消息 |
| `listen(json)` | `watch(json)` | NativeHost | 注册事件监听 |
| `unlisten(json)` | `unwatch(json)` | NativeHost | 注销事件监听 |
| `handle(params, groupId, helper)` | `execute(params, groupId, bridge)` | ActionHandler | 执行动作 |
| `routeListen(event)` | `routeWatch(event)` | BridgeRouter | 路由事件注册 |
| `routeUnlisten(event)` | `routeUnwatch(event)` | BridgeRouter | 路由事件注销 |
| `listen(event)` | `watch(event)` | EventManager | 注册监听者 |
| `unlisten(event)` | `unwatch(event)` | EventManager | 注销监听者 |
| `listenerCount` | `watchCount` | EventManager | 监听者计数 |
| `handlers` | `providers` | EventManager | 事件提供者映射 |
| `onFirstListener(event)` | `onFirstWatch(event)` | EventManager | 首次监听回调 |
| `onLastListener(event)` | `onLastWatch(event)` | EventManager | 末次监听回调 |
| `push(event, data)` | `emit(event, data)` | WebBridge | 推送事件到 Web |
