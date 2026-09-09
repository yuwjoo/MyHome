# 凭据与 OSS 模块设计（secret / oss / publishAssetStore）

## 数据流

```
electron-store: publishAssetStore.local.secretDir
        │（未配置则 fetchCredentials 返回 null）
        ▼
secret: 读取 <secretDir>/credentials.yaml (js-yaml) → Credentials
        ▼
oss: fetchCredentials()?.oss  → new OSS(config)（凭据变化自动重建）
```

## 目录与类型

- 类型统一收敛在 `src/main/module/secret/types/credentials.ts`：
  - `Credentials { oss: OssConfig }`：credentials.yaml 顶层结构
  - `OssConfig`：OSS 客户端凭据（region/accessKeyId/accessKeySecret/bucket 等）
- 其他模块引用时 import type 走 `@main/module/secret/types/credentials`，禁止重新内联定义。

## secret 模块（src/main/module/secret）

| 函数 | 说明 |
|---|---|
| `fetchCredentials()` | 有缓存返回缓存；无缓存读盘解析并缓存。`secretDir` 未配置 → 返回 `null` |
| `refreshCredentials()` | 清缓存后强制重读，用于文件有改动时主动刷新 |

- 文件缺失/非法（YAML 解析失败）直接抛错，不静默返回空凭据。
- 通过 `publishAssetStore.onDidChange('local', ...)` 监听；仅当 `secretDir` 值变化时清缓存。

## oss 模块（src/main/module/oss）

- `getOssClient()`：基于缓存的 OSS 凭据创建 `ali-oss` 客户端。
- 客户端按凭据值缓存：凭据字段逐一比较，值变化（refreshCredentials 或 secretDir 变更导致）
  后自动重建新客户端，调用方拿到的始终是「对应当前凭据」的实例。
- 凭据缺失时抛错：`OSS 客户端不可用：请先在配置中设置 local.secretDir`。

## 不变量

1. 读凭据是主进程本地行为；任何模块不得自行拼 `<secretDir>/credentials.yaml` 之外的自定义路径逻辑，统一走 secret 模块。
2. 凭据数据不落 renderer，经 IPC 只暴露业务结果（如 OSS 上传）而非明文凭据。
3. 新增凭据字段（如 FTP、npm token）→ 扩展 `Credentials` 类型 + 新增 secret 访问函数 + 更新本文档。
