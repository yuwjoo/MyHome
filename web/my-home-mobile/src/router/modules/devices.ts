/**
 * src/router/modules/devices.ts —— 设备控制相关路由
 */
import type { RouteRecordRaw } from 'vue-router'

export const deviceRoutes: RouteRecordRaw[] = [
  {
    path: '/devices',
    name: 'devices',
    component: () => import('@/views/devices/DevicesView.vue'),
    meta: { hideNav: true },
  },
  {
    path: '/ac-remote',
    name: 'ac-remote',
    component: () => import('@/views/devices/AcRemoteView.vue'),
    meta: { hideNav: true },
  },
]
