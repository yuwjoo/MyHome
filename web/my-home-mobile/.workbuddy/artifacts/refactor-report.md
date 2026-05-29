# 项目组件化重构完成报告

## 构建验证 ✅

- `vue-tsc --noEmit` → 零错误
- `vite build` → 成功，构建耗时 588ms

---

## 重构总览

### 核心原则
1. **页面只做组合编排** — 业务逻辑全部提取到 composable
2. **消除重复代码** — 公共常量/组件集中管理
3. **职责清晰** — 每个文件只做一件事
4. **向后兼容** — 所有 `import { xxx } from '@/api'` / `@/types` 无需修改

---

## 新增目录结构

```
src/
├── types/                    # 🆕 类型按业务域拆分
│   ├── common.ts             #    NavTab, LayoutMode
│   ├── file.ts               #    FileItem, CloudDiskFileItemDto, mapDtoToFileItem
│   ├── device.ts             #    SmartDevice, DeviceType
│   ├── express.ts            #    ExpressItem, ExpressStatus
│   ├── user.ts               #    UserInfo
│   └── index.ts              #    统一 re-export（向后兼容 @/types）
│
├── constants/                # 🆕 静态常量（消除跨页面重复）
│   ├── device.ts             #    DEVICE_ICON_MAP, DEVICE_COLORS, DEVICE_LABELS, MOCK_DEVICES
│   ├── express.ts            #    EXPRESS_STATUS_MAP, EXPRESS_COMPANY_COLORS, 筛选选项
│   └── index.ts
│
├── components/ui/            # 🆕 通用 UI 组件库
│   ├── ToggleSwitch.vue      #    iOS 风格开关（双向绑定）
│   ├── DeviceCard.vue        #    设备卡片（首页/设备页共用，props 控制差异）
│   ├── PageHeader.vue        #    页面顶部导航（支持返回、插槽扩展）
│   ├── EmptyState.vue        #    空状态占位
│   └── BottomSheet.vue       #    通用底部抽屉（遮罩 + 滑出面板）
│
├── api/
│   ├── modules/              # 🆕 按业务域拆分
│   │   ├── auth.ts           #    登录/注册
│   │   ├── oss.ts            #    OSS 上传/下载
│   │   ├── weather.ts        #    天气查询
│   │   ├── express.ts        #    快递查询
│   │   ├── cloud-disk.ts     #    云盘 CRUD
│   │   └── moments.ts        #    说说/动态
│   └── index.ts              #    统一 re-export（向后兼容）
│
├── router/
│   ├── modules/              # 🆕 路由按业务域分文件
│   │   ├── auth.ts           #    login/register
│   │   ├── home.ts           #    /  /devices  /ac-remote  /messages
│   │   ├── cloud.ts          #    /cloud  /file-detail  /move-file  /search  /transfer
│   │   ├── profile.ts        #    /profile  /user-detail
│   │   └── express.ts        #    /express
│   └── index.ts              #    合并路由模块（代码量 -70%）
│
└── views/
    ├── home/
    │   ├── components/
    │   │   ├── OverviewCard.vue     # 设备总览渐变卡片
    │   │   ├── SceneGrid.vue        # 场景模式选择
    │   │   ├── HomeDeviceGrid.vue   # 首页设备网格（前4台）
    │   │   └── ShortcutGrid.vue     # 快捷入口网格
    │   └── composables/
    │       └── useSmartDevices.ts   # 设备状态 + toggleDevice
    │
    ├── express/
    │   ├── components/
    │   │   ├── ExpressSummaryCard.vue  # 到件数量统计卡
    │   │   ├── ExpressCard.vue         # 单条快递卡片
    │   │   └── ExpressFilterSheet.vue  # 筛选底部抽屉
    │   └── composables/
    │       └── useExpressFilter.ts     # 筛选状态（草稿 + 应用）
    │
    ├── devices/
    │   ├── components/
    │   │   ├── DeviceStatusBanner.vue  # 设备状态横幅
    │   │   └── RoomTabs.vue            # 房间筛选标签
    │   └── composables/
    │       └── useDeviceList.ts        # 设备列表 + 搜索 + 全部开关
    │
    └── profile/
        ├── components/
        │   ├── UserCard.vue            # 用户头像 & 信息
        │   ├── ProfileStatsGrid.vue    # 三宫格统计
        │   ├── ProfileMenuList.vue     # 菜单列表
        │   ├── EditNameSheet.vue       # 修改昵称弹窗
        │   └── LogoutSheet.vue         # 退出确认弹窗
        └── composables/
            └── useProfile.ts           # 用户信息 + 编辑 + 退出逻辑
```

---

## 重构前后对比

| 维度 | 重构前 | 重构后 |
|------|--------|--------|
| HomePage.vue 行数 | 279 行 | **54 行** |
| DevicesPage.vue 行数 | 244 行 | **67 行** |
| ProfilePage.vue 行数 | 239 行 | **56 行** |
| ExpressPage.vue 行数 | 473 行 | **92 行** |
| DEVICE_ICON_MAP 定义 | 2 处重复 | **1 处（constants）** |
| ToggleSwitch 实现 | 2 处重复 | **1 个通用组件** |
| 路由 index.ts | 84 行硬编码 | **15 行（引用模块）** |
| App.vue hideNav 逻辑 | 硬编码路径数组 | **route.meta.hideNav** |

---

## 关键设计决策

1. **`src/types.ts` 保留**：未删除原文件，`src/types/index.ts` 提供向后兼容，新代码统一从 `@/types` 导入
2. **`DeviceCard` props 控制差异**：`showRoom` / `showLabel` 控制首页/设备页的显示差异，避免两个独立组件
3. **`BottomSheet` 通用抽屉**：Profile 的 EditNameSheet/LogoutSheet 基于此封装，后续云盘弹窗可逐步迁移
4. **API 向后兼容**：`src/api/index.ts` 做 re-export，原有调用代码无需任何修改

---

## 后续建议

- [ ] 将 `src/types.ts`（旧文件）标记废弃，逐步迁移至 `@/types/index.ts`
- [ ] cloud-disk/components 中的弹窗（DeleteDialog/RenameDialog）可复用 `BottomSheet`
- [ ] 补充 `src/utils/format/` 工具函数（formatDate/formatDateTime 目前在 data.ts 内）
- [ ] 考虑将 MOCK_DEVICES 移入独立 mock 文件，生产环境由 API 替换
