# 文件传输任务模块 — 开发设计文档

## 目录

- [1. 简介](#1-简介)
- [2. 整体运行流程](#2-整体运行流程)
- [3. 目录结构](#3-目录结构)
- [4. 各文件详细说明](#4-各文件详细说明)
  - [4.1 `types/task.ts` — 任务类型定义](#41-typestaskts--任务类型定义)
  - [4.2 `types/executor.ts` — 执行器接口](#42-typesexecutorts--执行器接口)
  - [4.3 `types/index.ts` — 类型统一导出](#43-typesindexts--类型统一导出)
  - [4.4 `utils/speedometer.ts` — 速度计算器](#44-utilsspeedometerts--速度计算器)
  - [4.5 `utils/taskFactory.ts` — 任务工厂](#45-utilstaskfactoryts--任务工厂)
  - [4.6 `stores/fileTransfer.ts` — Pinia Store](#46-storesfiletransferts--pinia-store)
  - [4.7 `engine.ts` — 传输引擎](#47-enginets--传输引擎)
  - [4.8 `executors/upload.ts` — 上传执行器](#48-executorsuploadts--上传执行器)
  - [4.9 `executors/download.ts` — 下载执行器](#49-executorsdownloadts--下载执行器)
  - [4.10 `index.ts` — 模块出口](#410-indexts--模块出口)

---

## 1. 简介

`fileTransfer` 是一个**纯逻辑、无 UI 依赖**的文件传输任务管理模块，提供上传 / 下载任务的**创建、排队、并发调度、暂停、取消、重试**等完整生命周期管理。

核心能力：

| 能力 | 说明 |
|------|------|
| 任务生命周期 | 从创建到完成的全状态流转（等待 → 传输中 → 成功/失败/取消） |
| 并发控制 | 上传 / 下载各自限制并发数，超出自动排队 |
| 进度反馈 | 实时回写 `loadedSize`、`progress`、`speed` 到响应式对象 |
| 执行器可插拔 | 通过 `TransportExecutor` 接口替换传输实现 |
| 持久化 | 页面刷新后任务列表可恢复，运行中任务标记为中断 |

---

## 2. 整体运行流程

```
调用方
  │  createTask / pauseTask / cancelTask / retryTask
  ▼
┌─────────────────────────────────────────────────────────────┐
│ ① Pinia Store（任务状态管理中心）                              │
│                                                             │
│  ▪ taskList 状态维护              ▪ 持久化任务列表             │
│  ▪ crud 操作暴露给调用方            ▪ 工厂创建任务并入队         │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ ② TransferEngine（并发调度引擎）                               │
│                                                             │
│  等待队列 → 并发检查 → 分配 slot → 调度执行                    │
│  进度/速度回写 task 对象                                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ ③ TransportExecutor（可插拔传输执行器）                         │
│                                                             │
│  ┌──────────────────┐       ┌───────────────────┐           │
│  │ UploadExecutor   │       │ DownloadExecutor  │           │
│  └──────────────────┘       └───────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
          进度 / 速度回写 ◄────┘

运行时数据结构：
  taskList      → 所有任务响应式数组
  waitingQueue  → 排队中的 taskId
  runningMap    → 执行中的任务上下文（task + executor + speedometer）

任务状态流转：
  WAITING ──→ TRANSFERRING ──→ SUCCESS / FAILED / CANCELED
                │    ▲                   │
                │    └── retryTask ──────┘
                ├──→ PAUSED ──→ WAITING（resumeTask）
                └──→ INTERRUPTED（页面卸载 / 刷新恢复）
```

**运行步骤**：
1. **Store** 暴露 `createTask / pauseTask / resumeTask / cancelTask / retryTask` 等 API，管理 `taskList`
2. **Engine** 维护等待队列 `waitingQueue` 和运行中任务 `runningMap`，按类型（上传/下载）限制并发数进行调度
3. **Executor** 是抽象接口，默认提供 `UploadExecutor` 和 `DownloadExecutor`，执行实际传输并通过回调回写进度

---

## 3. 目录结构

```
src/modules/fileTransfer/
├── index.ts                     ← 模块统一出口，导出 Store 和所有类型
├── types/
│   ├── index.ts                 ← barrel 导出
│   ├── task.ts                  ← 状态枚举 + TransferTask 数据结构
│   └── executor.ts             ← TransportExecutor 接口 + 回调类型
├── stores/
│   └── fileTransfer.ts         ← Pinia Store（任务状态 + 控制 actions）
├── engine.ts                   ← 传输引擎（并发调度 + 状态驱动）
├── executors/
│   ├── upload.ts               ← 默认上传执行器
│   └── download.ts             ← 默认下载执行器
└── utils/
    ├── speedometer.ts          ← 滑动窗口速度计算器
    └── taskFactory.ts          ← 任务对象工厂
```

外部引入方式：`import { useFileTransferStore, TransferType } from '@/modules/fileTransfer'`

---

## 4. 各文件详细说明

### 4.1 `types/task.ts` — 任务类型定义

**作用**：定义文件传输任务的所有枚举和数据结构。

**内容**

| 项目 | 类型 | 明细 |
|------|------|------|
| `TransferTaskStatus` | 枚举 | `WAITING`（等待调度）、`TRANSFERRING`（传输中）、`PAUSED`（已暂停）、`SUCCESS`（成功）、`FAILED`（失败）、`CANCELED`（已取消）、`INTERRUPTED`（刷新中断） |
| `TransferType` | 枚举 | `UPLOAD`（上传）、`DOWNLOAD`（下载） |
| `TransferTaskPlatform` | 枚举 | `WEB`、`ANDROID`、`HARMONY` |
| `TransferTask` | 接口 | `taskId`、`taskName`、`taskIcon`、`taskStatus`、`transferType`、`originPlatform`、`totalSize`、`loadedSize`、`progress`、`speed`、`createTime`、`finishTime?`、`errorMessage?`、`payload` |

**依赖**：无

---

### 4.2 `types/executor.ts` — 执行器接口

**作用**：定义传输执行器的抽象接口，所有上传/下载实现必须遵循。

**内容**

```ts
interface TransportExecutor {
  start(task: TransferTask, callbacks: ExecutorCallbacks): Promise<void>
  pause(): void
  cancel(): void
}

interface ExecutorCallbacks {
  onProgress: (loaded: number, total: number) => void
  onSpeedChange: (speed: number) => void
}
```

| 方法 | 说明 |
|------|------|
| `start()` | 执行传输，完成 resolve，失败 reject(errorMessage) |
| `pause()` | 中断当前传输（XHR.abort），状态由 Engine 变更 |
| `cancel()` | 终止并清理资源，状态由 Engine 变更 |

**依赖**：无

---

### 4.3 `types/index.ts` — 类型统一导出

**作用**：barrel 导出所有类型。

```ts
export * from './task'
export * from './executor'
```

---

### 4.4 `utils/speedometer.ts` — 速度计算器

**作用**：基于滑动窗口实时计算瞬时传输速度，200ms 采样一次。

**内部状态**

| 变量 | 类型 | 说明 |
|------|------|------|
| `samples` | `{ time: number, loaded: number }[]` | 最近 10 个采样点（2 秒窗口） |
| `currentLoaded` | `number` | 当前已传输量 |
| `onChange` | `(speed: number) => void` | 速度变化回调 |

**方法**

| 方法 | 说明 |
|------|------|
| `start(cb)` | 保存回调，启动 200ms 定时器 |
| `update(loaded)` | 更新当前已传输量 |
| `stop()` | 停止定时器，清空采样 |
| `reset()` | 同 stop + 重置 currentLoaded |

**算法**：`speed = (last.loaded - first.loaded) / (last.time - first.time)`

**依赖**：无

---

### 4.5 `utils/taskFactory.ts` — 任务工厂

**作用**：根据入参创建响应式 `TransferTask` 对象。

**函数**：`createTransferTask(options) → TransferTask`

**入参**

| 字段 | 类型 | 必填 | 默认值 |
|------|------|------|--------|
| `taskName` | `string` | ✅ | — |
| `taskIcon` | `string` | ✅ | — |
| `transferType` | `TransferType` | ✅ | — |
| `totalSize` | `number` | ✅ | — |
| `originPlatform` | `TransferTaskPlatform` | ❌ | `WEB` |
| `payload` | `Record<string, unknown>` | ❌ | `{}` |

**逻辑**：生成 UUID → 填充默认字段（`status=WAITING`, `progress=0`, `speed=0`, `createTime=now`）→ 返回 `reactive(task)`

**依赖**：`types/task.ts`、`uuid`

---

### 4.6 `stores/fileTransfer.ts` — Pinia Store

**作用**：文件传输任务的状态管理中心，对外暴露所有控制方法。

**State**

| 变量 | 类型 | 默认值 |
|------|------|--------|
| `taskList` | `Ref<TransferTask[]>` | `[]` |
| `concurrency` | `{ upload: number, download: number }` | `{ upload: 2, download: 3 }` |

**Getters**：`activeTasks`（传输中）、`waitingTasks`（排队中）、`failedTasks`（失败/中断）、`completedTasks`（已完成）、`activeCount`

**Actions**

| Action | 说明 |
|--------|------|
| `setExecutorFactory(factory)` | 覆盖默认执行器工厂（可选，内置默认工厂已开箱即用） |
| `createTask(options)` | 工厂创建任务 → 推入 taskList → engine 入队 → 返回 task |
| `deleteTask(taskId)` | 仅终态（SUCCESS / FAILED / CANCELED / INTERRUPTED）可删除 |
| `pauseTask(taskId)` | 委托 engine，task 状态 → PAUSED |
| `resumeTask(taskId)` | PAUSED → WAITING → 重新入队 |
| `cancelTask(taskId)` | 委托 engine，task 状态 → CANCELED |
| `retryTask(taskId)` | 重置进度和错误 → WAITING → 入队（仅 FAILED / INTERRUPTED 可重试） |
| `clearCompleted()` | 移除所有终态任务 |
| `recoverInterruptedTasks()` | 页面刷新恢复：将 TRANSFERRING 状态标记为 INTERRUPTED（Store 初始化时自动调用） |

**持久化**：`{ key: 'file-transfer-tasks', storage: localStorage, pick: ['taskList', 'concurrency'] }`

**依赖**：`types/task.ts`、`utils/taskFactory.ts`、`engine.ts`

---

### 4.7 `engine.ts` — 传输引擎

**作用**：并发调度核心，维护等待队列和运行中任务，按 FIFO 顺序按类型限制并发数。

**内部状态**

| 变量 | 类型 | 说明 |
|------|------|------|
| `waitingQueue` | `string[]` | 排队等待的 taskId（FIFO） |
| `runningMap` | `Map<string, RunningContext>` | 执行中的任务上下文 |
| `concurrencyOverride` | `{ upload, download } \| null` | 外部覆盖的并发配置（null 时使用 Store 响应式 getter） |
| `taskMap` | `Map<string, TransferTask>` | 所有入队任务的响应式对象引用，Engine 自维护 |

`RunningContext` = `{ task, executor, speedometer }`

**公开方法**

| 方法 | 说明 |
|------|------|
| `enqueue(task)` | 加入 waitingQueue → 尝试调度 |
| `pauseTask(taskId)` | executor.pause → runningMap 移除 → PAUSED → 尝试调度下一个 |
| `cancelTask(taskId)` | 从队列移除 或 executor.cancel → runningMap 移除 → CANCELED → 尝试调度下一个 |
| `setConcurrency(c)` | 覆盖并发上限（传 null 恢复使用 Store 值），触发重新调度 |
| `destroy()` | 取消所有运行中任务 → 标记为 INTERRUPTED → 清空队列和 taskMap |

**私有方法**

| 方法 | 说明 |
|------|------|
| `getCurrentConcurrency()` | 优先返回 `concurrencyOverride`，否则取 Store 的响应式 getter |
| `tryPickNext()` | 先 filter 清理失效项，再按 FIFO 正序遍历，按类型检查 `当前数 < 上限`，有空位则调用 `runTask` |
| `runTask(task)` | 状态 → TRANSFERRING，创建 RunningContext，启动 Speedometer，调用 `executor.start()`，完成后清理 |
| `onTaskDone(taskId, status)` | 停止 Speedometer → 写入终态、`finishTime` → 移除 runningMap → 触发下一轮调度 |

**调度逻辑**：
- `tryPickNext()` 正序（FIFO）遍历 waitingQueue，先 `filter` 清除失效项，再逐个检查并发上限
- `runTask` 中通过 `onProgress` 回写 `loadedSize`/`progress`，通过 Speedometer 回写 `speed`
- 完成或失败时调 `onTaskDone` 清理并触发下一轮调度
- `destroy()` 将运行中任务状态设为 `INTERRUPTED`（而非保持 `TRANSFERRING`）

**依赖**：`types/task.ts`、`types/executor.ts`、`utils/speedometer.ts`

---

### 4.8 `executors/upload.ts` — 上传执行器

**作用**：实现 `TransportExecutor`，封装完整上传流程。

**内部状态**

| 变量 | 类型 | 说明 |
|------|------|------|
| `xhr` | `XMLHttpRequest \| null` | 当前请求（用于 pause/cancel 时 abort） |

**方法**：`start`（hash 计算 → 获取签名 → 秒传跳过 / XHR PUT 直传）、`pause`（abort XHR）、`cancel`（abort XHR + 清理）

**依赖**：`types/executor.ts`、`utils/ossUpload.ts`

---

### 4.9 `executors/download.ts` — 下载执行器

**作用**：实现 `TransportExecutor`，封装完整下载流程。

**内部状态**

| 变量 | 类型 | 说明 |
|------|------|------|
| `xhr` | `XMLHttpRequest \| null` | 当前请求（用于 pause/cancel 时 abort） |

**方法**：`start`（XHR GET → blob → 触发浏览器下载）、`pause`（abort XHR）、`cancel`（abort XHR + 清理）

**依赖**：`types/executor.ts`

---

### 4.10 `index.ts` — 模块出口

**作用**：模块统一入口，外部只需一层 import。

```ts
export { useFileTransferStore } from './stores/fileTransfer'
export { TransferTaskStatus, TransferType, TransferTaskPlatform } from './types/task'
export type { TransferTask } from './types/task'
export type { TransportExecutor, ExecutorCallbacks } from './types/executor'
export { createExecutor as defaultExecutorFactory } from './executors'
```
