/**
 * src/router/modules/express.ts —— 快递相关路由
 */
import type { RouteRecordRaw } from 'vue-router'

export const expressRoutes: RouteRecordRaw[] = [
  {
    path: '/express',
    name: 'express',
    component: () => import('@/views/express/ExpressView.vue'),
  },
]
