# 项目长期记忆

## 技术栈
- Vue 3 + TypeScript + Vite + Pinia + Vue Router 5
- Tailwind CSS v4（原子化，通过 @tailwindcss/vite 集成）
- lucide-vue-next 图标库
- axios + 拦截器（src/utils/request/）
- vue-sonner Toast

## 项目规范（已确立）

### 目录架构
```
src/
  types/          # 类型按业务域拆分：common/file/device/express/user + index.ts
  constants/      # 跨页面静态常量：device（图标/颜色/Mock数据）、express（状态映射）
  components/ui/  # 通用 UI 组件：ToggleSwitch/DeviceCard/PageHeader/EmptyState/BottomSheet
  composables/    # 全局 composable：usePullRefresh
  api/
    modules/      # API 按业务域分文件：auth/oss/weather/express/cloud-disk/moments
    index.ts      # 统一 re-export，向后兼容
  router/
    modules/      # 路由按业务域分文件，route meta.hideNav 控制导航显示
    index.ts      # 路由入口
  stores/         # Pinia：app（登录状态）、auth（token + 持久化）
  views/
    home/         # 各页面模块化：components/ + composables/
    express/
    devices/
    profile/
    cloud-disk/   # 已有完整组件化（FilesView + 子组件 + composables）
```

### 编码规范
- 页面 Vue 文件只做组合编排，逻辑全部提取到 composables
- 跨页面复用组件放 components/ui/，模块专属组件放各自 views/xxx/components/
- 静态常量（DEVICE_ICON_MAP 等）统一放 constants/，禁止在组件内重复定义
- 路由 meta.hideNav = true 控制隐藏底部导航，不再维护路径白名单
- API 函数直接 return request(...)，不再声明 config 变量
- 偏好绝对路径 @/ 引用，禁止 ../ 跨模块
- 代码注释使用中文

## 重构历史
- 2026-05-28：完成全项目组件化/模块化/Hook 重构，vue-tsc 零错误，vite build 成功
