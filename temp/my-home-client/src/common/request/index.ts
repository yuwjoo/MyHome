import axios, { type AxiosRequestConfig } from "axios";
import { initInterceptor } from "./interceptor";

export const defaultConfig: AxiosRequestConfig = {
  baseURL: process.env.VUE_APP_API_SERVER_URL! + process.env.VUE_APP_API_SERVER_PREFIX!,
  timeout: 30000,
  sendEnv: "web"
};

export const request = axios.create(defaultConfig);

initInterceptor(request);
