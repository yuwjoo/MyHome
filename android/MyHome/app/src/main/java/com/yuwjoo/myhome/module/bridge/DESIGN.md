# NativeBridge Android 端开发文档

> 对应 Web 端模块：`web/my-home-mobile/src/modules/nativeBridge/`

## 目录

- [1. 简介](#1-简介)
- [2. 流程图](#2-流程图)
  - [2.1 业务流程图](#21-业务流程图)
  - [2.2 模块流程图](#22-模块流程图)
- [3. 运行流程](#3-运行流程)
- [4. 目录结构（建议）](#4-目录结构建议)
- [5. 总结](#5-总结)

---

## 1. 简介

NativeBridge 是 WebView 内前端与原生端之间的**双向消息通信模块**。Android 端通过 `addJavascriptInterface` 直接将 `NativeHost` 实例注入为 `window.__nativeHost`，Web 前端即可直接调用其 `call(json)` 方法发送消息。

- `window.__nativeHost` — 通过 `addJavascriptInterface` 注入的原生对象，暴露 `call(json)` 和 `platform()` 方法
- `window.__webBridge` — Web 端自行创建的回调注册中心，Android 通过 `evaluateJavascript` 调用其 `invoke()` 方法

---

## 2. 流程图

### 2.1 业务流程图

展示一次完整 `send()` 调用从 Web 到 Android 再回调的**数据流向**：

```
Web 前端                          Android 端
  │                                  │
  │ ① bridge.send(name, params, cb)  │
  │    ├─ JSON.stringify(body)       │
  │    └─ groupId = uuid (if cb)     │
  │                                  │
  │ ② __nativeHost.call(json) ──────→ NativeHost.call(json)
  │                                  │    ├─ parse messageName
  │                                  │    ├─ parse params
  │                                  │    └─ parse groupId
  │                                  │
  │                                  │ ③ handler.handle(name, params, gId)
  │                                  │    │
  │                                  │    └─ AppMessageHandler
  │                                  │       actions[name]?.execute(params, gId, helper)
  │                                  │          │
  │                                  │          ├─ 业务逻辑处理
  │                                  │          └─ helper.invokeCallback(gId, event, data)
  │                                  │                │
  │ ④ __webBridge.invoke(           │  ←───────────── evaluateJavascript
  │      gId, 'onSuccess', data)     │
  │    │                             │
  │    └─ CallbackRegistry.invoke()  │
  │       ├─ clearTimeout            │
  │       └─ cb.onSuccess(data) ✓    │
```

**主动推送**（Android → Web，无 groupId）：

```
Android 端                           Web 前端
  │                                    │
  │ helper.pushEvent(eventName, data)   │
  │   evaluateJavascript ─────────────→│
  │                                    │ __webBridge.invoke('__listeners', eventName, data)
  │                                    │   │
  │                                    │   └─ CallbackRegistry.invoke()
  │                                    │      └─ listeners.forEach(fn => fn(data))
```

### 2.2 模块流程图

展示 Android 端 `bridge/` 包内**类与接口的依赖关系**：

```
┌─────────────────────────────────────────────────────────────┐
│                       bridge/ 模块                           │
│                                                             │
│  window.__nativeHost  ◄── addJavascriptInterface 注入       │
│  ┌──────────────┐                                          │
│  │ NativeHost   │  @JavascriptInterface                    │
│  │ platform()   │                                          │
│  │ call(json)   │──┐                                       │
│  └──────────────┘  │ 委托                                   │
│                    ▼                                       │
│       NativeMessageHandler (interface)                     │
│         handle(name, params, groupId?)                      │
│                    ▲                                       │
│                    │ 实现                                   │
│       ┌────────────────────────────┐                       │
│       │ AppMessageHandler          │                       │
│       │ actions: Map<name, Action> │──┐ 分发               │
│       └────────────────────────────┘  │                    │
│                    │                  ▼                    │
│                    │        MessageAction (interface)       │
│                    │          name: String                 │
│                    │          execute(params, gId, helper)  │
│                    │                  ▲                    │
│                    │     ┌────────────┼────────────┐       │
│                    │     │            │            │       │
│                    │  handlers/  handlers/   handlers/     │
│                    │  PageChanged GetData    Upload        │
│                    │  Action     Action     Action         │
│                    │     │            │            │       │
│                    │     └────────────┼────────────┘       │
│                    │                  │                    │
│                    │           WebViewHelper               │
│                    │     invokeCallback()   pushEvent()    │
│                    │                  │                    │
│                    │                  ▼                    │
│                    │     window.__webBridge                │
│                    │       (CallbackRegistry)              │
└────────────────────────────────────────────────────────────┘
```

---

## 3. 运行流程

### 步骤 1 — WebView 初始化时注入 `__nativeHost`

```kotlin
// WebViewManager.kt 或 CustomWebView.kt

webView.apply {
    // 直接注入为 window.__nativeHost，Web 端即可调用 call(json)
    addJavascriptInterface(
        NativeHost(messageHandler),
        "__nativeHost"
    )
}
```

```kotlin
// NativeHost.kt
import android.webkit.JavascriptInterface
import org.json.JSONObject

class NativeHost(private val handler: NativeMessageHandler) {

    @JavascriptInterface
    fun platform(): String = "android"

    @JavascriptInterface
    fun call(json: String) {
        val msg = JSONObject(json)
        val messageName = msg.getString("messageName")
        val params = msg.getJSONObject("params")
        val groupId = msg.optString("groupId", null)

        handler.handle(messageName, params, groupId)
    }
}
```

### 步骤 2 — 编写消息处理器

采用**模块化**方式，每个 `messageName` 对应一个独立的 Action 类，避免单个 `when` 分支随功能增长而臃肿。

**统一接口 — `MessageAction`**：

```kotlin
// MessageAction.kt
import org.json.JSONObject

interface MessageAction {
    val name: String // 对应 Web 端 send() 的 messageName

    fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper)
}
```

```kotlin
// NativeMessageHandler.kt
import org.json.JSONObject

interface NativeMessageHandler {
    fun handle(messageName: String, params: JSONObject, groupId: String?)
}
```

**handlers 目录 — 按功能拆分**：

```kotlin
// handlers/PageChangedAction.kt
import org.json.JSONObject

class PageChangedAction : MessageAction {
    override val name = "pageChanged"

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val route = params.getString("route")
        Log.d("App", "页面切换: $route")
    }
}
```

```kotlin
// handlers/GetDataAction.kt
import org.json.JSONObject

class GetDataAction : MessageAction {
    override val name = "getData"

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val id = params.getInt("id")
        val result = JSONObject().apply { put("name", "张三") }
        helper.invokeCallback(groupId, "onSuccess", result)
    }
}
```

```kotlin
// handlers/UploadAction.kt
import org.json.JSONObject

class UploadAction : MessageAction {
    override val name = "upload"

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        helper.invokeCallback(groupId, "onProgress", """{"percent": 50}""")
        helper.invokeCallback(groupId, "onSuccess", """{"url": "https://..."}""")
    }
}
```

**统一注册 — `AppMessageHandler`**：

```kotlin
// AppMessageHandler.kt
import org.json.JSONObject

class AppMessageHandler(private val helper: WebViewHelper) : NativeMessageHandler {

    private val actions: Map<String, MessageAction> = listOf(
        PageChangedAction(),
        GetDataAction(),
        UploadAction(),
    ).associateBy { it.name }

    override fun handle(messageName: String, params: JSONObject, groupId: String?) {
        actions[messageName]?.execute(params, groupId, helper)
    }
}
```

新增功能时只需：
1. 在 `handlers/` 下新建一个 `MessageAction` 实现类
2. 在 `AppMessageHandler` 的 `listOf(...)` 中注册一行

### 步骤 3 — Android 端回调 Web 端

`WebViewHelper.invokeCallback()` 封装了回调逻辑，内部通过 `evaluateJavascript` 调用 `window.__webBridge.invoke()`：

```kotlin
// WebViewHelper.kt（部分）
class WebViewHelper(private val webView: WebView) {

    fun invokeCallback(groupId: String?, eventName: String, data: Any) {
        if (groupId == null) return

        val dataJson = when (data) {
            is String -> data
            is JSONObject -> data.toString()
            else -> JSONObject.wrap(data).toString()
        }

        val js = """
            window.__webBridge.invoke(
                "$groupId",
                "$eventName",
                $dataJson
            );
        """.trimIndent()

        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }
}
```

`evaluateJavascript` 通过 `webView.post {}` 确保在主线程执行。

### 步骤 4 — Android 端主动推送事件

```kotlin
fun pushEvent(eventName: String, data: String) {
    val js = """
        window.__webBridge.invoke(
            '__listeners',
            '$eventName',
            $data
        );
    """.trimIndent()

    webView.post {
        webView.evaluateJavascript(js, null)
    }
}

fun onNetworkChanged(isConnected: Boolean) {
    pushEvent("networkChange", """{"isConnected": $isConnected}""")
}

fun onAppResume() {
    pushEvent("appResume", "null")
}
```

### 步骤 5 — 消息协议对照表

**Web → Android（`window.__nativeHost.call(json)` 调用）**：

| JSON 字段 | 类型 | 必填 | 说明 |
|-----------|------|:--:|------|
| `messageName` | `string` | ✅ | 消息名称，Android 据此路由 |
| `params` | `object` | ✅ | 业务参数 |
| `groupId` | `string` | ❌ | 仅 Web 端传了 `callbacks` 时存在 |

**Android → Web（`__webBridge.invoke()` 调用）**：

| 参数 | 值 | 说明 |
|------|----|------|
| 第 1 个（groupId） | `groupId` | 响应 `send()` 时 |
| | `'__listeners'` | 主动推送事件时 |
| 第 2 个（eventName） | `'onSuccess'` / `'onProgress'` / `'onError'` | 响应回调时 |
| | 自定义事件名 | 主动推送时 |
| 第 3 个（data） | 业务数据 | 任意 JSON 值 |

---

## 4. 目录结构（建议）

```
app/src/main/java/com/example/app/bridge/
├── NativeHost.kt              ← @JavascriptInterface，注入为 __nativeHost
├── NativeMessageHandler.kt    ← 消息处理接口
├── AppMessageHandler.kt       ← 统一注册中心，路由 messageName → Action
├── MessageAction.kt           ← Action 统一接口
├── handlers/
│   ├── PageChangedAction.kt   ← 页面切换处理
│   ├── GetDataAction.kt       ← 获取数据处理
│   └── UploadAction.kt        ← 上传处理
└── WebViewHelper.kt           ← 封装 invokeWeb / pushEvent
```

`WebViewHelper.kt` 封装示例：

```kotlin
class WebViewHelper(private val webView: WebView) {

    fun invokeCallback(groupId: String, eventName: String, data: Any) {
        val js = buildInvokeJs(groupId, eventName, data)
        webView.post { webView.evaluateJavascript(js, null) }
    }

    fun pushEvent(eventName: String, data: Any) {
        val js = buildInvokeJs("__listeners", eventName, data)
        webView.post { webView.evaluateJavascript(js, null) }
    }

    private fun buildInvokeJs(groupId: String, eventName: String, data: Any): String {
        val dataJson = when (data) {
            is String -> data
            else -> Gson().toJson(data)
        }
        return """
            window.__webBridge.invoke(
                "$groupId",
                "$eventName",
                $dataJson
            );
        """.trimIndent()
    }
}
```

与 Web 端 `config.ts` 对应的常量，Android 端需保持一致：

| 常量 | 值 | 说明 |
|------|----|------|
| `NATIVE_HOST` | `'__nativeHost'` | 注入到 `window` 的宿主对象名 |
| `WEB_BRIDGE` | `'__webBridge'` | `window` 上的回调注册中心名 |
| `LISTENER_GROUP` | `'__listeners'` | 事件监听的消息组名 |

---

## 5. 总结

| 要点 | 说明 |
|------|------|
| 注入对象 | `addJavascriptInterface(NativeHost, "__nativeHost")` 直接注入 |
| 消息路由 | `AppMessageHandler` 通过 `Map<String, MessageAction>` 注册分发 |
| 模块化 | 每个 `messageName` 对应 `handlers/` 下一个独立 Action 类 |
| 回调 Web | 通过 `window.__webBridge.invoke(消息组, 事件, 数据)` |
| 消息组 | 响应 `send()` 时传 `groupId`，主动推送时传 `'__listeners'` |
| 主线程 | `evaluateJavascript` 通过 `webView.post {}` 确保在主线程执行 |
| 超时 | 由 Web 端自行管理，Android 端无需处理 |
| 新增功能 | 新建 Action → `handlers/`，在 `AppMessageHandler.listOf(...)` 中注册一行 |
