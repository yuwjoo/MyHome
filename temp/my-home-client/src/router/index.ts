import { routes } from "./routes";
import { createRouter, createWebHashHistory, type RouteLocationNormalizedLoaded, type Router } from "vue-router";
import { initInterceptor } from "./interceptor";

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});

/**
 * @description: router实例hook
 * @return {Router} router
 */
export const useRouter = (): Router => {
  return router;
};

/**
 * @description: route实例hook
 * @return {RouteLocationNormalizedLoaded} route
 */
export const useRoute = (): RouteLocationNormalizedLoaded => {
  return new Proxy(router.currentRoute, {
    get(target: Ref<RouteLocationNormalizedLoaded>, key: keyof RouteLocationNormalizedLoaded) {
      return target.value[key];
    }
  }) as unknown as RouteLocationNormalizedLoaded;
};

initInterceptor(router);
