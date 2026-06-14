# 文件传输任务模块 — 使用文档

## 快速开始

```ts
import { useFileTransferStore, TransferType } from '@/modules/fileTransfer'

// 一行搞定 — 默认执行器已内置，中断任务自动恢复
const store = useFileTransferStore()
```

---

## 完整示例

### 在 Vue 组件中使用

```vue
<script setup lang="ts">
import { useFileTransferStore, TransferType } from '@/modules/fileTransfer'

const store = useFileTransferStore()

function startUpload(file: File) {
  store.createTask({
    taskName: file.name,
    taskIcon: 'upload',
    transferType: TransferType.UPLOAD,
    totalSize: file.size,
    payload: { file },
  })
}

function startDownload(name: string, url: string, size: number) {
  store.createTask({
    taskName: name,
    taskIcon: 'download',
    transferType: TransferType.DOWNLOAD,
    totalSize: size,
    payload: { downloadUrl: url },
  })
}
</script>

<template>
  <div>
    <!-- 传输中 -->
    <div v-for="t in store.activeTasks" :key="t.taskId">
      {{ t.taskName }} — {{ t.progress }}% — {{ t.speed }} B/s
      <button @click="store.pauseTask(t.taskId)">暂停</button>
      <button @click="store.cancelTask(t.taskId)">取消</button>
    </div>
    <!-- 失败任务 -->
    <div v-for="t in store.failedTasks" :key="t.taskId">
      {{ t.taskName }} — {{ t.errorMessage }}
      <button @click="store.retryTask(t.taskId)">重试</button>
      <button @click="store.deleteTask(t.taskId)">删除</button>
    </div>
    <!-- 暂停任务 -->
    <div v-for="t in store.completedTasks" :key="t.taskId"
         v-if="t.taskStatus === 'PAUSED'">
      {{ t.taskName }} — 已暂停
      <button @click="store.resumeTask(t.taskId)">恢复</button>
      <button @click="store.cancelTask(t.taskId)">取消</button>
    </div>
  </div>
</template>
```

---

## API 参考

### Store Actions

#### `setExecutorFactory(factory)`

覆盖默认执行器工厂（自定义执行器时使用）。Store 已内置默认工厂，无需调用即可正常使用。

```ts
store.setExecutorFactory(myCustomFactory)
```

---

#### `createTask(options)`

创建传输任务并自动入队调度。返回响应式 `TransferTask` 对象。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `taskName` | `string` | ✅ | 任务名称 |
| `taskIcon` | `string` | ✅ | 图标标识 |
| `transferType` | `TransferType` | ✅ | `UPLOAD` 或 `DOWNLOAD` |
| `totalSize` | `number` | ✅ | 总大小（字节） |
| `originPlatform` | `TransferTaskPlatform` | ❌ | 来源平台，默认 `WEB` |
| `payload` | `Record<string, unknown>` | ❌ | 负载数据 |

```ts
const task = store.createTask({
  taskName: 'photo.jpg',
  taskIcon: 'image',
  transferType: TransferType.UPLOAD,
  totalSize: 1024000,
  payload: { file: myFile },
})

console.log(task.taskId)   // UUID
console.log(task.progress) // 0~100，响应式
console.log(task.speed)    // B/s，响应式
```

**payload 约定**：
- 上传：`{ file: File }`
- 下载：`{ downloadUrl: string }`

---

#### `pauseTask(taskId)` / `resumeTask(taskId)`

暂停 / 恢复指定任务。

```ts
store.pauseTask(task.taskId)   // 传输中 → 已暂停
store.resumeTask(task.taskId)  // 已暂停 → 等待调度
```

---

#### `cancelTask(taskId)`

取消任务（任何非终态均可取消）。

```ts
store.cancelTask(task.taskId)  // → CANCELED
```

---

#### `retryTask(taskId)`

重试失败或中断的任务。重置进度、错误信息，重新入队。

```ts
store.retryTask(task.taskId)  // FAILED / INTERRUPTED → WAITING
```

---

#### `deleteTask(taskId)`

删除终态任务（SUCCESS / FAILED / CANCELED / INTERRUPTED）。

```ts
store.deleteTask(task.taskId)
```

---

#### `clearCompleted()`

一键清除所有终态任务。

```ts
store.clearCompleted()
```

---

#### `recoverInterruptedTasks()`

页面刷新后恢复：将持久化中状态为 `TRANSFERRING` 的任务标记为 `INTERRUPTED`。**Store 初始化时自动调用**，一般无需手动触发。

---

### Store State（响应式）

| 属性 | 类型 | 说明 |
|------|------|------|
| `store.taskList` | `TransferTask[]` | 全部任务列表 |
| `store.concurrency` | `{ upload: number, download: number }` | 并发配置，默认 `{ upload: 2, download: 3 }` |

### Store Getters（计算属性）

| Getter | 类型 | 说明 |
|--------|------|------|
| `store.activeTasks` | `TransferTask[]` | 传输中的任务 |
| `store.waitingTasks` | `TransferTask[]` | 排队等待的任务 |
| `store.failedTasks` | `TransferTask[]` | 失败 / 中断的任务 |
| `store.completedTasks` | `TransferTask[]` | 已完成的任务（成功 / 取消 / 暂停） |
| `store.activeCount` | `number` | 当前传输中任务数 |

---

## 任务状态机

```
  WAITING ──→ TRANSFERRING ──→ SUCCESS
                │                  FAILED
                │                  CANCELED
                ├──→ PAUSED ──→ WAITING（resumeTask）
                └──→ INTERRUPTED（页面卸载 / 刷新恢复）

  FAILED / INTERRUPTED ──→ WAITING（retryTask）
```

### 状态说明

| 状态 | 含义 | 可操作 |
|------|------|--------|
| `WAITING` | 排队等待调度 | pauseTask、cancelTask |
| `TRANSFERRING` | 正在传输 | pauseTask、cancelTask |
| `PAUSED` | 已暂停 | resumeTask、cancelTask |
| `SUCCESS` | 传输成功 | deleteTask |
| `FAILED` | 传输失败 | retryTask、deleteTask |
| `CANCELED` | 已取消 | deleteTask |
| `INTERRUPTED` | 刷新中断 | retryTask、deleteTask |

---

## 并发控制

默认并发配置：上传 2 个、下载 3 个同时进行。超出限制的任务自动进入等待队列（FIFO）。

```ts
// 修改并发配置
store.concurrency = { upload: 3, download: 5 }
```

修改后 Engine 自动触发新一轮调度。

---

## 自定义执行器

默认执行器通过 `defaultExecutorFactory` 注入，也可替换为自定义实现：

```ts
import type { TransportExecutor, ExecutorCallbacks } from '@/modules/fileTransfer'
import type { TransferTask } from '@/modules/fileTransfer'

class MyUploadExecutor implements TransportExecutor {
  async start(task: TransferTask, callbacks: ExecutorCallbacks): Promise<void> {
    // 自定义上传逻辑
    callbacks.onProgress(loaded, total)
  }
  pause(): void { /* ... */ }
  cancel(): void { /* ... */ }
}

// 自定义工厂
store.setExecutorFactory((type) => {
  if (type === TransferType.UPLOAD) return new MyUploadExecutor()
  return defaultExecutorFactory(type)
})
```

---

## 持久化

任务列表自动通过 `pinia-plugin-persistedstate` 持久化到 `localStorage`：

- **key**：`file-transfer-tasks`
- **持久化字段**：`taskList`、`concurrency`
- **不持久化**：执行器实例、速度计算器（运行时重建）

页面刷新后：
1. `taskList` 从 localStorage 恢复
2. Store 初始化时自动调用 `recoverInterruptedTasks()`，将 `TRANSFERRING` 标记为 `INTERRUPTED`
3. 用户可对 INTERRUPTED 任务调用 `retryTask()` 重新传输

---

## 注意事项

1. **开箱即用**：`useFileTransferStore()` 即可，无需额外初始化
2. **`createTask` 返回的对象是响应式的**（`reactive()`），直接在模板中使用即可实时反映进度
3. **上传 `payload.file` 必须是 `File` 类型**，下载 `payload.downloadUrl` 必须是有效 URL
4. **中断任务自动恢复**：页面刷新后 `TRANSFERRING` 自动标记为 `INTERRUPTED`，用户可重试
5. **`Speedometer` 200ms 采样一次**，速度曲线平滑约 2 秒窗口
