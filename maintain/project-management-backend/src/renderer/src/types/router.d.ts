/**
 * @file 路由类型扩展
 * @description 扩展 vue-router 的 RouteMeta，为路由元信息提供类型约束
 */
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题（用于顶栏展示） */
    title?: string
  }
}
