import type { Router } from "vue-router";
import { useAuthStore } from "@/store/auth";

/**
 * @description: 初始化路由拦截
 */
export const initInterceptor = (router: Router) => {
  // 路由前置钩子
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore(); // 认证store
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth); // 检查是否需要认证

    if (requiresAuth && !authStore.isLoggedIn) {
      // 如果页面需要认证但用户未登录，重定向到登录页
      next({ name: "login", query: { redirectPath: to.fullPath } });
    } else {
      // 正常访问
      next();
      document.title = to.meta.title as string; // 设置页面标题
    }
  });

  // 路由后置钩子
  router.afterEach(() => {
    // 可以在这里添加页面访问日志等
  });
};
