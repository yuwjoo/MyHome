import type { Router } from "vue-router";

/**
 * @description: 初始化路由拦截
 */
export const initInterceptor = (router: Router) => {
  // 路由前缀拦截
  router.beforeEach(() => {
    return true;
  });
};
