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

### 目录分类

| 分类                  | 说明                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 集合目录（结尾带s）   | 存放一堆同类型/功能需要被统一管理的代码文件，只会有任意个集合文件/目录和一个common目录，外部只能访问每个集合文件/目录 |
| 聚合目录（结尾不带s） | 存放一种功能/特性的全部代码，只会有一个`index`文件和任意个其他文件/目录，外部只能访问`index`文件                      |

### 基础目录

| 目录       | 说明                         |
| ---------- | ---------------------------- |
| `modules/` | 存放模块化化后的代码         |
| `common/`  | 存放公共代码                 |
| `utils/`   | 存放纯逻辑、无副作用工具代码 |
| `types/`   | 存放ts类型代码               |
| `assets/`  | 存放静态资源                 |
| `hooks/`   | 存放web端vue hook代码        |
| `doc/`     | 存放当前域的文档             |

### 项目结构

```text
src/
├── main/                 # 主进程（桌面层）
│   ├── modules/          # 所有业务能力模块
│   ├── ipc/              # IPC通道监听/发送
│   ├── stores/           # 所有本地持久化仓库
│   ├── utils/            # 工具函数
│   └── types/            # ts类型
├── preload/              # 预加载脚本（桥接层）
│   └── api/              # 暴露给渲染进程的api
├── renderer/             # 渲染进程（Web层）
│   └── src/
│       ├── api/          # 请求api
│       ├── assets/       # 静态资源
│       ├── layout/       # 页面布局
│       ├── router/       # 页面路由
│       ├── views/        # 页面
│       ├── utils/        # 工具函数
│       └── types/        # ts类型
└── shared/               # 主 / 渲染共享（共享层）
    └── types/            # ts类型
```

## 规范

### 通用规范

1. 目录/文件命名使用小驼峰命名法；前端.vue文件除了index文件，其他文件名使用大驼峰命名法；前端路由path/name，vue组件名称都使用小驼峰
2. 所有层级的目录代码，都要参考基础目录来组织结构
3. 永远只能访问上级/同级目录的代码文件
4. ts类型中：interface都加上`I`前缀，type都加上`T`前缀，enum都加上`E`前缀
5. 函数返回类型必须声明，即使为空也要声明`void`
6. 改任意代码时，如果该目录下当前层有目录`doc`，必需先读取`doc`目录下的`INDEX.md`文件，并遵循其中的约定

### 注释规范

#### 文件头注释

```ts
/**
 * @file <文件名>
 * @description <说明字段：一句话讲清职责，复杂文件可换行续写约定 / 注意点>
 * @see <文档链接>（可选：模块沉淀了设计文档 / 有关联文档时填写，如 docs/design/release.md）
 */
```

#### 函数注释

```ts
/**
 * 获取发版配置
 * @param projectName 项目名称；为空时返回 null
 * @returns 发版配置数据
 */
export function fetchReleaseConfig(projectName: string): ReleaseConfig | null
```

#### 类型 / 枚举 / class 注释

```ts
/**
 * 项目信息
 */
interface IProjectInfo {
  /**
   * 项目名称
   */
  projectName: string
}

/**
 * 项目类型枚举
 */
enum EProjectType {
  /**
   * Android 原生项目
   */
  Android = 'android',
  /**
   * nest 服务项目
   */
  Nest = 'nestJS'
}

/**
 * 终端模块
 */
class Terminal {
  /**
   * 终端类型
   */
  private type = ''

  /**
   * 启动命令
   * @param command 要执行的命令
   * @returns 是否启动成功
   */
  run(command: string): boolean {
    return true
  }
}
```

#### 变量注释

```ts
// OSS 根路径
const ossRootPath = ''
```
