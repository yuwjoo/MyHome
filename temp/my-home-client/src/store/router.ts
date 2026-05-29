import { defineStore } from "pinia";
import { routes } from "@/router/routes";
import type { RouteRecordRaw } from "vue-router";

/**
 * @description: 路由-store
 */
export const useRouterStore = defineStore("router", () => {
  const whiteList = ref<string[]>(["login", "notFound"]); // 路由白名单

  const keepAliveList = ref<string[]>([]); // 缓存路由列表

  const getKeepAliveList = (routes: RouteRecordRaw[]) => {
    const keepAliveNameList: string[] = [];
    routes.forEach((route) => {
      if (route.meta?.keepAlive) {
        keepAliveNameList.push(route.name as string);
      }
      if (route.children) {
        keepAliveNameList.push(...getKeepAliveList(route.children));
      }
    });

    return keepAliveNameList;
  };

  keepAliveList.value = getKeepAliveList(routes);

  return {
    whiteList: readonly(whiteList),
    keepAliveList
  };
});
