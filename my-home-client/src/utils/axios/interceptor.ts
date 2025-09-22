import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import androidAdapter from "./androidAdapter";

/**
 * @description: 请求拦截器
 * @param {InternalAxiosRequestConfig} config 配置
 * @return {InternalAxiosRequestConfig} 新配置
 */
export function onRequestFulfilled(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  switch (config.sendEnv) {
    case "android":
      config.adapter = androidAdapter;
      break;
    default:
      config.adapter = ["xhr", "http", "fetch"];
  }
  return config;
}

/**
 * @description: 请求异常拦截器
 * @param {any} error 异常
 * @return {any} 异常数据
 */
export function onRequestRejected(error: any): any {
  return error;
}

/**
 * @description: 响应拦截器
 * @param {AxiosResponse} response 响应
 * @return {AxiosResponse} 新响应
 */
export function onResponseFulfilled(response: AxiosResponse): AxiosResponse {
  return response;
}

/**
 * @description: 响应异常拦截器
 * @param {any} error 异常
 * @return {any} 异常数据
 */
export function onResponseRejected(error: any): any {
  return error;
}
