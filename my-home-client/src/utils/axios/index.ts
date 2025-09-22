import axios, { type AxiosRequestConfig } from "axios";
import { onRequestFulfilled, onRequestRejected, onResponseFulfilled, onResponseRejected } from "./interceptor";

export const defaultConfig: AxiosRequestConfig = {
  timeout: 30000,
  sendEnv: "web"
};

export const request = axios.create(defaultConfig);

request.interceptors.request.use(onRequestFulfilled, onRequestRejected);
request.interceptors.response.use(onResponseFulfilled, onResponseRejected);
