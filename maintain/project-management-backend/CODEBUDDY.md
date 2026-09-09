# project-management-backend

桌面端项目管理应用

## 技术选型

### 桌面层

| 职责           | 技术             | 说明                                           |
| -------------- | ---------------- | ---------------------------------------------- |
| 应用运行时     | Electron         | 桌面应用容器                                   |
| 构建工具       | electron-vite    | main / preload / renderer 三端一体化构建与开发 |
| 打包分发       | electron-builder | win / mac / linux 平台产物                     |
| 应用自动更新   | electron-updater | 配合打包产物做增量更新                         |
| 本地配置持久化 | electron-store   | 配置以本地 JSON 持久化                         |

### Web 层

| 职责      | 技术         | 说明 |
| --------- | ------------ | ---- |
| 前端框架  | Vue 3        |      |
| 开发语言  | TypeScript   |      |
| UI 组件库 | Element Plus |      |
| 路由管理  | vue-router   |      |
| HTTP 请求 | axios        |      |
| 样式处理  | Sass         |      |

## 目录设计

目录为**设计基准**：新增 / 重命名 / 迁移目录前须对照下图，实际落地演进以此为准。

```text
src/
├── main/                 # 主进程（桌面层）
│   ├── modules/          # 所有业务能力模块
│   │   └── common/       # 公共代码
│   ├── ipc/              # IPC通道监听/发送
│   ├── stores/           # 所有本地持久化仓库
│   │   └── common/       # 公共代码
│   ├── utils/            # 工具函数
│   └── types/            # 主进程通用类型
├── preload/              # 预加载脚本（桥接层）
│   └── api/              # 暴露给渲染进程的api
├── renderer/             # 渲染进程（Web层）
│   └── src/
│       ├── api/          # 请求封装层：window.electronApi 桥与 axios 的统一入口
│       ├── assets/       # 静态资源与全局样式
│       ├── layout/       # 主布局与框架组件
│       ├── router/       # 路由表
│       ├── views/        # 页面，按功能分子目录（与路由一一对应）
│       ├── utils/        # 工具函数
│       └── types/        # 类型声明与自动生成 d.ts
└── shared/               # 主 / 渲染共享
    └── types/            # 跨进程类型，按领域分子目录（config / ipc），不放运行时代码
```

工程根另含构建与质量配置（`electron.vite.config.ts`、`tsconfig*.json`、`electron-builder.yml`、`eslint.config.mjs`）、`resources/`（图标等静态资源）、`docs/design/`（设计文档）。路径别名：`@main/*`、`@preload/*`、`@shared/*`、`@renderer/*`。

## 铁律

1. 模块公共类型一律放 `<module>/types/`，不得散落于实现文件。
2. 业务能力一律落于 `src/main/module/*`；`src/main/ipc/*` 仅作薄转发，不得内联业务逻辑。
3. 跨进程类型一律放 `src/shared/types/`；渲染进程经 preload 暴露的桥访问主进程，不得直接 import electron。
4. 导入一律使用别名（`@main/*`、`@preload/*`、`@shared/*`、`@renderer/*`），模块内部使用相对路径。
5. 修改公共 API 或模块职责前先读对应设计文档，变更后同步更新；源码与设计文档不一致时以源码为准并回写文档。
6. 规范冲突裁决顺序：铁律与模块约束 > `docs/design` 设计文档 > 源码现状。
7. 本文件改动在新开会话后生效。

## 模块约束

### terminal（`module/terminal/**`）

- 零第三方依赖：不引入 node-pty / xterm.js 等（有明确 PTY 需求并经评审除外）。
- 类型定义收敛于 `terminal/types/`，外部经模块统一出口引用。
- API 不变量：支持后台运行与系统终端窗口两种模式；能力为 run / appendCommand / write / kill / onLog / onExit；onExit 晚注册须补触发；命令结束后实例可复用；kill 按进程树终止（Windows）。
- 设计文档：`docs/design/terminal.md`。

### secret / oss（`module/secret/**`、`module/oss/**`）

- 类型定义收敛于 `secret/types/credentials.ts`，不得在其他位置重复内联。
- 凭据读取仅经 secret 模块（fetchCredentials / refreshCredentials），其他模块不得自行拼装 secretDir 读取 yaml。
- 凭据明文不得下发至渲染进程。
- 新增凭据字段：扩展类型 + 访问函数 + 同步设计文档。
- 设计文档：`docs/design/credentials-oss.md`。

### 其他（publish / IPC 通道明细 / renderer）

- 未沉淀设计文档，以源码为准；能力定型后在 `docs/design` 沉淀并登记 `00-index.md`。

## 注释规范

注释统一使用中文，说明**职责、契约与 Why**，不复述实现。

- **文件头**：每个源文件以 `/** @file … */` 概括职责；复杂模块追加要点式的「特性 / 约定」说明。

```ts
/**
 * @file 终端模块：以子进程方式执行命令，支持后台运行与系统终端窗口两种模式
 */
```

- **导出类 / 函数 / 类型**：以 JSDoc 描述职责与行为约定；有入参出参时标注 `@param` / `@returns`。

```ts
/**
 * 获取凭据数据
 * 有缓存直接返回缓存；无缓存时读取 credentials.yaml 解析并写入缓存后返回
 * @returns 凭据数据
 */
export function fetchCredentials(): Credentials | null
```

- **类型字段**：一律单行 `/** 中文说明 */`（公共类型字段注释即文档，随 IDE 提示可见）。

```ts
export interface ProjectInfo {
  /** 项目名称 */
  projectName: string
  /** OSS 发布目录 */
  ossPublishDir: string
}
```

- **行内注释**：用 `//` 标注关键分支与时序（Why），如“延迟到同步调用栈结束后执行，保证外部先完成监听器注册”。
- **禁止**：逐行翻译式注释、无信息量的注释、与代码不符的注释。
- **遗留项**：以 `TODO` / `FIXME` 标注并写明背景。

## 编码规范

### 格式与质量门禁

- Prettier 风格：2 空格缩进、单引号、无分号。
- 门禁：`npm run lint`（ESLint flat：TS recommended + Vue flat/recommended，`vue/block-lang` 强制 script 为 TS）、`npm run typecheck`（tsc + vue-tsc 双工程）。

### TypeScript 与 import

- 类型引用独立使用 `import type { … }`。
- 跨层引用用别名，模块内引用用相对路径。
- 显式标注返回类型，无返回值写 `: void`；不使用无理由的 `any`。
- 主 / 渲染两端共用的配置与通道类型只在 `shared/types/` 定义一次，避免两端漂移。

### 命名

| 对象               | 风格                                          | 示例                                              |
| ------------------ | --------------------------------------------- | ------------------------------------------------- |
| 目录 / 文件        | 语义化，小驼峰或 kebab                        | `views/configManagement/`、`publishAssetStore.ts` |
| Vue 组件文件       | PascalCase；页面统一 `index.vue` 置于功能目录 | `AppHeader.vue`、`views/projectPublish/index.vue` |
| 类 / 接口 / 类型   | PascalCase（接口不加 `I` 前缀）               | `Terminal`、`ProjectInfo`                         |
| 常量               | UPPER_SNAKE_CASE                              | `DEFAULT_MAX_BUFFER`                              |
| 变量 / 函数 / 属性 | camelCase                                     | `fetchCredentials`                                |
| IPC 通道           | `<域>:<动作>`                                 | `release:getProjectList`                          |

### IPC 与跨进程

- 通道契约唯一源在 `src/shared/types/ipc/`，聚合于 `main/ipc/types/Ipc.ts` 供两端引用；新增 / 修改通道先改契约。
- 主进程注册使用 `ipc/utils/handler.ts` 的 handle / on / send，处理器只做校验与转发。
- preload 经 contextBridge 暴露聚合桥对象 `window.electronApi`；渲染层请求统一收口于 `renderer/src/api/`，页面不得散调底层桥。

### Vue SFC

- 一律 `<script setup lang="ts">`。
- Vue API（ref / computed 等）与 Element Plus 组件、`ElMessage` 由 unplugin 自动导入，不显式 import；声明见 `types/auto-imports.d.ts`、`types/components.d.ts`（自动生成，不手改）。
- 组件样式默认 `<style scoped>`；全局样式只入 `assets/base.scss`。
- 新增页面：`views/<功能>/index.vue` + `router/index.ts` 注册（懒加载）+ `layout/menu.ts` 同步。
- 异步调用一律 await 并兜底失败（ElMessage 提示）。

### 分层与依赖方向

- 依赖方向：`main/ipc → main/module → (store / shared)`；module 之间可复用但不得互相 import 形成环。
- module 与 electron 解耦（必须访问 app / 窗口的场合除外），便于独立测试与复用。
- 新增业务模块：`module/<name>/index.ts`（出口）+ `types/` → 需跨进程则在 `ipc/` 注册薄处理器并在 preload 桥暴露 → 补充共享契约类型 → 在 `docs/design` 沉淀。

## 文档与索引

- 设计文档统一存放 `docs/design/`，总索引 `00-index.md`；模块能力定型后在 `docs/design` 沉淀并登记索引。
- 铁律与模块约束是约束收口处，不维护独立规则文件；本文件改动新开会话后生效（铁律第 7 条）。
