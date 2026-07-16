/**
 * src/router/modules/lan.ts —— 内网设备路由
 */
import type { RouteRecordRaw } from 'vue-router'

export const lanRoutes: RouteRecordRaw[] = [
  {
    path: '/lan',
    name: 'lan',
    component: () => import('@/views/lan/LanDevicesView.vue'),
  },
]
