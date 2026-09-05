import { createRouter, createWebHistory } from 'vue-router'

import RecipeListView from '@/views/RecipeListView.vue'
import RecipeSearchView from '@/views/RecipeSearchView.vue'
import RecipeEditorView from '@/views/RecipeEditorView.vue'
import RecipeDetailView from '@/views/RecipeDetailView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import { getToken } from '@/services/authSession'

/**
 * 路由表
 *  - /login /register    登录/注册（public）
 *  - /                   菜谱列表（首页，需登录）
 *  - /recipe/new         新建菜谱
 *  - /recipe/:id         菜谱详情（查看图片/视频、备注）
 *  - /recipe/:id/edit    编辑菜谱（与新建共用编辑器）
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },
    { path: '/', name: 'list', component: RecipeListView },
    { path: '/search', name: 'recipe-search', component: RecipeSearchView },
    { path: '/recipe/new', name: 'recipe-new', component: RecipeEditorView },
    {
      path: '/recipe/:id',
      name: 'recipe-detail',
      component: RecipeDetailView,
      props: true,
    },
    {
      path: '/recipe/:id/edit',
      name: 'recipe-edit',
      component: RecipeEditorView,
      props: true,
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    // 路由切换回到顶部，贴近原生 App 行为
    return { top: 0 }
  },
})

// 登录守卫：非公开页需已登录；已登录用户访问登录/注册页则回首页
router.beforeEach((to) => {
  const hasToken = Boolean(getToken())
  if (!to.meta.public && !hasToken) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && hasToken) {
    return { name: 'list' }
  }
  return true
})

export default router
