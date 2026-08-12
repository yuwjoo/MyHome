/**
 * 爬虫通用工具
 */

import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { AxiosInstance } from 'axios'

/**
 * 简单延时，规避反爬
 * @param {number} ms 延时毫秒数
 * @return {Promise<void>} 延时结束后 resolve
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 请求 HTML 并加载为 cheerio 对象
 * @param {AxiosInstance} request 配置好的 axios 实例
 * @param {string} url 目标页面地址
 * @return {Promise<CheerioAPI>} 已加载的 cheerio 文档对象
 */
export async function loadHtml(
  request: AxiosInstance,
  url: string,
): Promise<CheerioAPI> {
  const resp = await request.get<string>(url)
  return cheerio.load(resp.data)
}
