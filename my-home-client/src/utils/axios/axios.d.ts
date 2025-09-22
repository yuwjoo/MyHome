import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    sendEnv?: "web" | "android"; // 发送请求的环境
  }
}
