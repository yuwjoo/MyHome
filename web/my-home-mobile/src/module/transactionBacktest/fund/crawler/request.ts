/**
 * 请求实例
 */

import axios from 'axios'

/**
 * 浏览器 UA，部分接口校验
 */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

/**
 * 天天基金 Referer
 */
const TTJJ_REFERER = 'https://fundf10.eastmoney.com/'

/**
 * 预配置的天天基金请求实例
 * @return {AxiosInstance} 配置好请求头与超时的 axios 实例
 */
export const ttjjRequest = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': USER_AGENT,
    Referer: TTJJ_REFERER,
  },
})
