# novel-web

```
# 我的家智能家居客户端

一个基于 Vue 3 + TypeScript + Vant UI 的智能家居管理系统客户端。

## 功能特性

- **动态页面**：类似朋友圈功能，支持查看和发表动态内容
- **空调控制**：智能空调管理界面
- **云盘存储**：类似百度云盘的文件管理系统，支持文件夹操作和文件管理
- **个人中心**：用户信息展示、头像更换、深色模式切换等功能

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## 项目结构

```
src/
  ├── api/            # API 接口管理
  │   ├── cloud-disk.ts    # 云盘相关 API
  │   ├── moments.ts       # 动态相关 API
  │   ├── profile.ts       # 用户信息相关 API
  │   └── types/           # TypeScript 类型定义
  ├── assets/         # 静态资源
  ├── components/     # 公共组件
  ├── layout/         # 布局组件
  │   ├── components/      # 布局子组件（如底部导航栏）
  │   └── layout-main.vue  # 主布局
  ├── router/         # 路由配置
  │   └── routes.ts        # 路由定义
  ├── stores/         # 状态管理
  ├── utils/          # 工具函数
  ├── views/          # 页面组件
  │   ├── air-conditioner/  # 空调页面
  │   ├── cloud-disk/       # 云盘页面
  │   ├── moments/          # 动态页面
  │   └── profile/          # 个人中心页面
  ├── App.vue         # 应用入口组件
  └── main.ts         # 应用入口文件
```

## 技术栈

- **框架**：Vue 3 + Vite
- **语言**：TypeScript
- **UI 组件库**：Vant
- **样式预处理器**：SCSS
- **路由**：Vue Router
- **状态管理**：Pinia

## 代码规范

### 1. 目录结构规范

- 按照功能模块划分目录
- 使用小写字母和连字符（-）命名文件和目录
- 组件文件使用 PascalCase 命名（如 `MyComponent.vue`）

### 2. 代码风格规范

- **TypeScript**：严格类型检查，避免使用 `any`
- **组件设计**：保持组件单一职责，提高复用性
- **注释规范**：
  - 公共组件和函数必须添加文档注释
  - 复杂逻辑添加行内注释
  - 接口和类型定义必须有描述

### 3. 格式化规范

- **换行符**：使用 CRLF
- **缩进**：使用 2 个空格
- **引号**：字符串使用单引号
- **分号**：语句结束添加分号

### 4. API 设计规范

- 统一在 `src/api` 目录下管理所有 API
- 每个功能模块单独一个文件
- API 类型定义放在 `src/api/types` 目录
- 模拟接口返回与实际接口相同的数据结构

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

```
