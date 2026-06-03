/**
 * 应用全局常量配置
 */

import { ENV } from "entry/BuildProfile";

export class BaseConfig {
  // Web 入口文件名 
  static readonly indexFile: string = 'index.html';
  // WebView 加载的网页地址
  static readonly webHomeUrl: string = ENV !== 'debug'
    ? 'http://47.115.161.79:5173/'
    : 'http://local-web/';
}
