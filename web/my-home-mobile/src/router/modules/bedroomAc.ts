/**
 * src/router/modules/bedroomAc.ts —— 卧室空调控制路由
 */
import type { RouteRecordRaw } from 'vue-router'

export const bedroomAcRoutes: RouteRecordRaw[] = [
  {
    path: '/bedroom-ac',
    name: 'bedroom-ac',
    component: () => import('@/views/bedroomAc/BedroomAcView.vue'),
  },
]
