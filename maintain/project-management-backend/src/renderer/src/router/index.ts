import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    // 顶级布局：顶部 header + 左侧 sidebar + 右侧主区域
    component: () => import('@renderer/layout/index.vue'),
    redirect: '/project-publish',
    children: [
      {
        path: 'project-publish',
        name: 'ProjectPublish',
        component: () => import('@renderer/views/projectPublish/index.vue'),
        meta: { title: '项目发布' }
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('@renderer/views/configManagement/index.vue'),
        meta: { title: '配置管理' }
      }
    ]
  }
]

const router = createRouter({
  // Electron 生产环境以 file:// 加载，采用 hash 路由避免路径问题
  history: createWebHashHistory(),
  routes
})

export default router
