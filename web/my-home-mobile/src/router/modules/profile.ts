/**
 * src/router/modules/profile.ts —— 个人中心相关路由
 */
import type { RouteRecordRaw } from 'vue-router'

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/profile/ProfileView.vue'),
  },
  {
    path: '/user-detail',
    name: 'user-detail',
    component: () => import('@/views/profile/UserDetailView.vue'),
    meta: { hideNav: true },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('@/views/profile/ChangePasswordView.vue'),
    meta: { hideNav: true },
  },
]
