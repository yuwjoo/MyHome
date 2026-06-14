---
name: file-transfer-dev-plan
overview: 根据 DESIGN.md，将文件传输模块的开发任务按业务流转顺序编排为 8 个递进步骤，每步包含功能目标、涉及接口、验收标准，确保前置步骤输出是后置步骤的输入。
todos:
  - id: step-1-types
    content: 步骤 1：实现类型地基（types/task.ts、types/executor.ts、types/index.ts）— 定义所有枚举、数据结构和抽象接口
    status: completed
  - id: step-2-utils
    content: 步骤 2：实现任务工厂和速度计算器（utils/taskFactory.ts、utils/speedometer.ts）— 支持创建任务实例和实时速度计算
    status: completed
    dependencies:
      - step-1-types
  - id: step-3-store
    content: 步骤 3：实现 Pinia Store 状态管理中心（stores/fileTransfer.ts）— 提供任务 CRUD API 和状态管理
    status: completed
    dependencies:
      - step-2-utils
  - id: step-4-engine
    content: 步骤 4：实现传输引擎并发调度（engine.ts）— 管理等待队列、并发控制和任务调度
    status: completed
    dependencies:
      - step-3-store
  - id: step-5-executors
    content: 步骤 5：实现传输执行器（executors/upload.ts、executors/download.ts）— 完成端到端上传和下载能力
    status: completed
    dependencies:
      - step-4-engine
  - id: step-6-export-persist
    content: 步骤 6：实现模块出口、持久化和集成验证（index.ts + 持久化配置）— 打通外部接入和页面刷新恢复
    status: completed
    dependencies:
      - step-5-executors
---

## 产品概述

根据 `DESIGN.md` 开发设计文档，将文件传输任务模块的开发任务按**核心功能业务流转顺序**进行结构化编排，形成可逐层 Review 的开发计划。

## 核心要求

1. 严格按业务流转顺序拆分步骤，每个步骤是清晰的功能推进，而非孤立的模块划分
2. 每个开发步骤包含：功能目标、涉及的文档接口、验收标准
3. 步骤间逻辑递进，前置步骤的输出作为后置步骤的输入，保证端到端功能闭环

## 业务流转顺序

调用方 createTask → 任务创建（taskFactory）→ 入队（Engine enqueue）→ 并发调度（Engine tryPickNext）→ 执行传输（Executor start）→ 进度回写（onProgress/onSpeedChange）→ 状态变更 → 完成/失败 → 清理并调度下一个

## 技术栈

- 语言：TypeScript
- 状态管理：Pinia（Vue 3 响应式）
- 构建工具：Vite（现有项目）
- 持久化：pinia-plugin-persistedstate

## 实施方案

### 步骤编排思路（按业务流转）

```
步骤 1：类型地基（types/task.ts + types/executor.ts + types/index.ts）
  ↓ 输出：所有数据结构与接口定义，后续步骤的依赖契约
步骤 2：任务创建与速度测算（utils/taskFactory.ts + utils/speedometer.ts）
  ↓ 输出：可创建任务实例 + 实时速度计算能力
步骤 3：状态管理中心（stores/fileTransfer.ts）
  ↓ 输出：任务列表管理 + CRUD API，可独立运行（暂不接入 Engine）
步骤 4：并发调度引擎（engine.ts）
  ↓ 输出：等待队列 + 并发控制 + 任务调度，使 Store 能真正驱动任务执行
步骤 5：传输执行器（executors/upload.ts + executors/download.ts）
  ↓ 输出：端到端上传/下载能力，完整三层架构打通
步骤 6：模块出口 + 持久化 + 集成验证（index.ts + 持久化配置 + 调用方验证）
  ↓ 输出：完整可用的模块，端到端功能闭环
```

### 现有代码分析

已有部分实现（`src/stores/fileTransfer/`）：

- `types.ts`：已有 TransferTaskStatus、TransferType、TransferTaskPlatform、TransferTask
- 问题：状态枚举中 `UPLOADING` 命名与文档 `TRANSFERRING` 不一致；缺少 `INTERRUPTED` 状态；TransferTask 缺少 `errorMessage?` 字段
- `transferTask.ts`：已有 createTransferTask 工厂函数
- 问题：payload 类型为 `any`，应改为 `Record<string, unknown>`
- `index.ts`：已有基础 Store 实现
- 问题：使用 `defineStore` 而非 Pinia 的 `defineStore`；缺少 Engine 集成；缺少 pause/resume/cancel/retry 等 Action；持久化配置不完整

### 关键技术决策

1. **类型优先**：先定义所有类型和接口，后续步骤严格遵循类型契约
2. **Engine 与 Store 解耦**：Engine 不依赖 Store，通过回调通知状态变更（避免循环依赖）
3. **速度计算使用滑动窗口**：200ms 采样间隔，10 样本窗口（2秒），避免瞬时速度抖动
4. **持久化策略**：仅持久化 taskList 和 concurrency，RunningContext（executor/speedometer）不可序列化，刷新后重新创建
5. **INTERRUPTED 状态处理**：页面刷新时，Store 初始化阶段扫描 taskList，将 TRANSFERRING 状态的任务标记为 INTERRUPTED

### 架构设计

```
调用方
  │
  ▼
┌─────────────────────────────────┐
│  Pinia Store                   │
│  - taskList 状态管理           │
│  - 暴露 CRUD API              │
└─────────────┬─────────────────┘
              │ 调用方触发 Action
              ▼
┌─────────────────────────────────┐
│  TransferEngine                │
│  - waitingQueue（等待队列）     │
│  - runningMap（运行中任务）     │
│  - tryPickNext（调度）         │
└─────────────┬─────────────────┘
              │ 调度时创建 Executor
              ▼
┌─────────────────────────────────┐
│  TransportExecutor（接口）       │
│  ┌──────────────┐ ┌──────────┐│
│  │UploadExecutor │ │DownloadEx││
│  └──────────────┘ └──────────┘│
└─────────────────────────────────┘
              │
              ▼
          进度/速度回调
```

### 目录结构（目标）

```
src/modules/fileTransfer/
├── index.ts                     ← 模块统一出口
├── types/
│   ├── index.ts
│   ├── task.ts                  ← 状态枚举 + TransferTask
│   └── executor.ts             ← TransportExecutor 接口
├── stores/
│   └── fileTransfer.ts         ← Pinia Store
├── engine.ts                   ← 传输引擎
├── executors/
│   ├── upload.ts               ← 上传执行器
│   └── download.ts             ← 下载执行器
└── utils/
    ├── speedometer.ts          ← 速度计算器
    └── taskFactory.ts          ← 任务工厂
```