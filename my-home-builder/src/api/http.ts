/**
 * API 请求层
 * 封装 Axios 实例，统一请求拦截、错误处理
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

/** 通用响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/** 创建 Axios 实例 */
const http: AxiosInstance = axios.create({
  baseURL: '', // 可配置为远程构建服务地址
  timeout: 120000, // 构建请求超时较长
  headers: {
    'Content-Type': 'application/json',
  },
});

/** 请求拦截器 */
http.interceptors.request.use(
  (config) => {
    // 可在此添加 token 等鉴权信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/** 响应拦截器 */
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    ElMessage.error(error.message || '网络错误');
    return Promise.reject(error);
  },
);

export default http;
