import type { AxiosInstance, AxiosResponse } from "axios";
import { useAuthStore } from "@/store/auth";
import type { ResponseBody } from "@/api/types";

/**
 * @description: 初始化拦截器
 */
export const initInterceptor = (axios: AxiosInstance) => {
  // 请求拦截器
  axios.interceptors.request.use((config) => {
    const authStore = useAuthStore();

    // 配置token
    config.headers["Authorization"] = `Bearer ${authStore.accessToken}`;

    return config;
  });

  // 响应拦截器
  axios.interceptors.response.use(
    (response: AxiosResponse<ResponseBody>) => {
      if (response?.data.code !== 200) handleError(response);
      return response;
    },
    (error) => {
      handleError(error.response);
      return Promise.reject(error);
    }
  );
};

/**
 * 处理异常
 * @param response 响应
 */
const handleError = (response: AxiosResponse<ResponseBody>) => {
  if (!response.headers["content-type"].includes("application/json")) return;
  if (response?.data.code === 401) {
    showToast({
      message: "登录状态失效，请重新登录！",
      position: "bottom"
    });
    useAuthStore().logout();
  } else {
    showToast({
      message: response?.data.message || "网络繁忙！",
      position: "bottom"
    });
  }
};
