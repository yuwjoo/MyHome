# 主进程架构与扩展约定

## 技术底座

- electron-vite + Electron 39 + Vue 3 + TypeScript，三端构建：`main` / `preload` / `renderer`。
- 路径别名：`@main/*` → `src/main/*`，`@shared/*` → `src/shared/*`，`@preload/*` → `src/preload/*`。
- store 默认配置见 `src/main/store/publishAssetStore.ts`，统一出口 `src/main/store/index.ts`。

## 主进程分层

```
src/main/
├── index.ts        # 窗口创建与 app 生命周期；import '@main/ipc' 引入 IPC 注册
├── module/         # 业务能力模块（唯一放业务的地方）
│   ├── secret/     #   本地凭据加载
│   ├── oss/        #   OSS 客户端
│   ├── terminal/   #   命令执行终端
│   └── publish/    #   发布流程（建设中）
├── store/          # electron-store 本地配置（publishAssetConfig）
└── ipc/            # IPC 处理器（薄转发，不内联业务）
    ├── index.ts    #   出口，export ipcSend
    ├── utils/      #   handler 封装
    ├── types/
    └── releaseIpc.ts  # 发布相关通道注册（通道明细以源码为准）
```

依赖方向：`ipc → module → (store / shared)`；`module` 之间允许复用但不得互相 import 形成环。

## Store 结构（publishAssetConfig）

- `local`：本地数据。`rootDir` 本地根目录、`secretDir` 凭据目录（`credentials.yaml` 所在）、`projects` 项目列表、`androidStudio` JDK/SDK 路径。
- `oss`：发布侧 OSS 路径。`rootDir` / `versionManifestPath` / `secretPath`。
- 配置持久化由 `electron-store` 负责；业务模块可用 `publishAssetStore.onDidChange('local', ...)` 订阅字段变化（见 secret 模块的缓存失效）。

## IPC 约定

- 注册：新建 `ipc/xxxIpc.ts`，在 `ipc/index.ts` import 使其生效。
- 处理器只做参数校验与转发，业务放 `module/`。
- 渲染侧经 `preload/api/*` 暴露（如 `releaseApi`），通道名与参数类型以
  `src/main/ipc/releaseIpc.ts` 与 `src/preload/api/releaseApi.ts` 为准。

## 新增一个业务模块的步骤

1. `src/main/module/<name>/` 下建 `index.ts`（导出）+ `types/`（公共类型）。
2. 实现与调用方解耦的纯逻辑（不依赖 electron，除非必须访问 app/窗口）。
3. 需要被渲染层调用 → 在 `ipc/` 加薄处理器、`preload/api/` 暴露桥。
4. 在 `docs/design/00-index.md` 登记一行，并沉淀 `<name>.md`。
