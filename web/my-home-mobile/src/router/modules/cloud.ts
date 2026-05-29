/**
 * src/router/modules/cloud.ts —— 云盘相关路由
 */
import type { RouteRecordRaw } from 'vue-router'

export const cloudRoutes: RouteRecordRaw[] = [
  {
    path: '/cloud',
    name: 'cloud',
    component: () => import('@/views/cloudDisk/FilesView.vue'),
  },
  {
    path: '/file-detail',
    name: 'file-detail',
    component: () => import('@/views/cloudDisk/FileDetailView.vue'),
    meta: { hideNav: true },
  },
  {
    path: '/move-file',
    name: 'move-file',
    component: () => import('@/views/cloudDisk/MoveFileView.vue'),
    meta: { hideNav: true },
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/cloudDisk/SearchView.vue'),
  },
  {
    path: '/transfer',
    name: 'transfer',
    component: () => import('@/views/cloudDisk/TransferView.vue'),
    meta: { hideNav: true },
  },
]
