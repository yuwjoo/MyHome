/*
 * @FileName: auth.ts
 * @FilePath: \my-home-client\src\store\auth.ts
 * @Author: YH
 * @Date: 2025-11-30 01:27:44
 * @LastEditors: YH
 * @LastEditTime: 2026-05-11 21:08:35
 * @Description: 用户认证状态管理
 */
import { defineStore } from "pinia";
import { StorageSerializers, useStorage } from "@vueuse/core";
import { useRouter } from "@/router";
import type { LoginParams, STSInfo, UserInfo } from "@/api/auth/types";
import { systemAuthLogin } from "@/api/base";
import type { ServerApi } from "@/api/base/types";

/**
 * 用户认证Store
 */
export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();
  // 用户信息对象
  const userInfo = useStorage<UserInfo | null>("userInfo", null, localStorage, {
    serializer: StorageSerializers.object
  });
  // 访问令牌
  const accessToken = useStorage<string | undefined>("accessToken", undefined);
  // 登录状态标识
  const isLoggedIn = computed(() => !!accessToken.value);
  // sts信息
  const stsInfo = useStorage<STSInfo | null>("stsInfo", null, localStorage, {
    serializer: StorageSerializers.object
  });

  /**
   * 用户登录
   * @description 用户登录功能，获取并保存用户信息和访问令牌
   * @param {LoginParams} params - 登录参数
   * @returns {Promise<ServerApi["/system/auth/login"]["response"]>} 登录结果
   * @throws {Error} 登录失败时抛出错误
   */
  const login = async (params: LoginParams): Promise<ServerApi["/system/auth/login"]["response"]> => {
    const response = await systemAuthLogin({
      userAccount: params.username,
      password: params.password
    });

    userInfo.value = response.data.data.user;
    accessToken.value = response.data.data.token;

    return response.data.data;
  };

  /**
   * 用户退出登录
   * @description 清除用户认证状态并从本地存储中移除认证数据
   */
  const logout = (): void => {
    clearAuthData();
    router.replace({ name: "login" });
  };

  /**
   * 清除认证状态
   * @description 重置所有认证相关的响应式状态
   */
  const clearAuthData = (): void => {
    userInfo.value = null;
    accessToken.value = undefined;
    stsInfo.value = null;
  };

  return {
    isLoggedIn,
    userInfo,
    accessToken,
    stsInfo,
    login,
    logout,
    clearAuthData
  };
});
