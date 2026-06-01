/**
 * 应用全局常量配置
 */

import { ENV } from "entry/BuildProfile";

// Web 入口文件名
export const INDEX_FILE: string = 'index.html';

// WebView 加载的网页地址
export const WEB_HOME_URL: string = ENV === 'debug'
  ? 'http://47.115.161.79:5173/'
  : 'http://local-web/';
