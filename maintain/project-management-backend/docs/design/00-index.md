# 设计文档索引

本文档是该仓库设计文档的**唯一总目录**，也是改码前的路由表。
阅读顺序：入口 `CODEBUDDY.md`（铁律与模块约束收口处）→ 本文档定位文档 → 通读对应设计文档后再改码。

## 状态说明

- **已沉淀**：已按当前实现核对，可作为改码依据；公共 API 变化后必须同步更新。
- **约定级**：描述分层与新增模块步骤，不枚举具体通道明细。
- **待沉淀**：尚未撰写。遇到此类模块先读源码，确认现状后请先补文档再大规模改动。

## 设计文档清单

| 范围 / 触发条件 | 文档 | 状态 |
|---|---|---|
| 任何改动前（先看这里） | `docs/design/00-index.md` | — |
| 主进程分层、新增模块步骤、store 结构 | `docs/design/main-architecture.md` | 约定级 |
| `src/main/module/terminal/**`、需要执行命令的功能 | `docs/design/terminal.md` | 已沉淀 |
| `src/main/module/secret/**`、`src/main/module/oss/**`、`credentials.yaml` | `docs/design/credentials-oss.md` | 已沉淀 |
| `src/main/module/publish/**` | — | 待沉淀 |
| `src/main/ipc/**`、`src/preload/api/**` 通道明细 | — | 待沉淀（约定见 main-architecture.md） |
| `src/renderer/**` 页面/路由/布局 | — | 待沉淀 |

> 模块约束（terminal 零依赖、secret 凭据读取规则等）统一收口在 `CODEBUDDY.md`「模块约束」，本文件只维护设计文档目录，不再放置规则文件。

## 改动流程约定

1. 定位改动影响范围 → 对照 `CODEBUDDY.md`「铁律」与「模块约束」，再查上表选择设计文档。
2. 通读对应设计文档，理解不变量后再改代码。
3. 若改动公共 API / 模块职责 → 同步更新文档（含状态列），并检查 `CODEBUDDY.md`「模块约束」是否需同步。
4. 若文档与实际代码不符 → 以源码为准，修正文档并标注原因。
5. 若模块「待沉淀」→ 先读源码梳理职责，改动完成后补一份设计文档再进入下一阶段。
