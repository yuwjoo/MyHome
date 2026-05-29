/**
 * src/router/modules/home.ts —— 首页 & 消息相关路由
 */
import type { RouteRecordRaw } from 'vue-router'

export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/HomeView.vue'),
  },
  {
    path: '/messages',
    name: 'messages',
    component: () => import('@/views/home/MessagesView.vue'),
    meta: { hideNav: true },
  },
]
