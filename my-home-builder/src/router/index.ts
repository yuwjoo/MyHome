/**
 * 路由配置
 * 管理发布功能的页面导航
 */
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Publish',
    component: () => import('@/views/PublishView.vue'),
    meta: { title: '项目发布' },
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
