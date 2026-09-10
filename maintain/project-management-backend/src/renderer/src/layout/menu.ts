/**
 * @file 侧边栏菜单配置
 * @description 定义菜单项结构与侧边栏菜单数据
 */
import type { Component } from 'vue'
import { Promotion, Setting } from '@element-plus/icons-vue'

/**
 * 侧边栏菜单项
 */
export interface IAppMenuItem {
  /** 路由路径，同时作为菜单项唯一标识 */
  path: string
  /** 菜单显示名 */
  title: string
  /** 菜单图标组件 */
  icon: Component
}

// 侧边栏菜单配置（后续如需动态菜单，可改为接口下发后映射）
export const appMenus: IAppMenuItem[] = [
  { path: '/projectPublish', title: '项目发布', icon: Promotion },
  { path: '/configManagement', title: '配置管理', icon: Setting }
]
