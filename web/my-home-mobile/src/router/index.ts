/**
 * src/router/index.ts
 * 路由入口 —— 按业务域分模块加载，减少单文件体量
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { authRoutes }    from './modules/auth'
import { homeRoutes }    from './modules/home'
import { deviceRoutes }  from './modules/devices'
import { cloudRoutes }   from './modules/cloud'
import { profileRoutes } from './modules/profile'
import { expressRoutes }  from './modules/express'
import { bedroomAcRoutes } from './modules/bedroomAc'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...homeRoutes,
    ...deviceRoutes,
    ...expressRoutes,
    ...bedroomAcRoutes,
    ...cloudRoutes,
    ...profileRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/common/NotFoundView.vue'),
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    // 浏览器前进/后退：恢复到上次离开时的滚动位置
    if (savedPosition) {
      return savedPosition
    }
    // 正常路由跳转：回到顶部
    return { top: 0 }
  },
})

/**
 * 全局路由守卫：默认所有路由需要登录，meta.isPublic 设为 true 可跳过认证
 */
router.beforeEach((to, _from, next) => {
  const isPublic = to.meta.isPublic === true
  const appStore = useAppStore()

  if (!isPublic && !appStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
