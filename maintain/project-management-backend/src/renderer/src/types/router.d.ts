import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题（用于顶栏展示） */
    title?: string
  }
}
