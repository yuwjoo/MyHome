import { request } from "@/utils/axios";
import type { LoginParams, LoginResponse, RegisterParams, STSInfo } from "./types";
import type { ResponseBody } from "../types";

// 注册
export const register = (params: RegisterParams) => {
  return request<ResponseBody>({
    url: "/auth/register",
    method: "post",
    data: params
  });
};

// 登录
export const login = (params: LoginParams) => {
  return request<ResponseBody<LoginResponse>>({
    url: "/auth/login",
    method: "post",
    data: params
  });
};

// 登出
export const logout = () => {
  return request<ResponseBody>({
    url: "/auth/logout",
    method: "post"
  });
};

// 获取sts信息
export const getSTSInfo = () => {
  return request<ResponseBody<STSInfo>>({
    url: "/auth/getSTSInfo",
    method: "get"
  });
};
