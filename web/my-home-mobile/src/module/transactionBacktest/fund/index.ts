/**
 * 基金数据本地管理与抓取入口
 */

import fs from 'fs'
import path from 'path'
import type { Fund } from '../types/fund'
import type { FundListItem, FundListPage } from '../types/crawler'
import { fetchFundList as crawlFundList, fetchFundData as crawlFundData } from './crawler'
import { DATA_DIR, LIST_FILE, FUND_DIR } from './config'

/**
 * 读取本地基金列表
 * @return {FundListItem[]} 本地缓存的基金列表
 */
export function getLocalFundList(): FundListItem[] {
  if (!fs.existsSync(LIST_FILE)) return []
  const raw = fs.readFileSync(LIST_FILE, 'utf-8')
  return JSON.parse(raw) as FundListItem[]
}

/**
 * 获取基金列表（支持分页与模糊搜索）
 * @param {string} keyword 关键词（代码或名称片段）
 * @param {number} pageIndex 页码
 * @param {number} pageSize 每页大小
 * @return {Promise<FundListPage>} 基金列表数据
 */
export async function fetchFundList(
  keyword: string,
  pageIndex: number = 1,
  pageSize: number = 30,
): Promise<FundListPage> {
  return crawlFundList(keyword, pageIndex, pageSize)
}

/**
 * 读取本地基金数据
 * @param {string} code 基金代码
 * @return {Fund | null} 本地缓存的基金数据，未找到返回 null
 */
export function getLocalFundData(code: string): Fund | null {
  const file = path.join(FUND_DIR, `${code}.json`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf-8')
  return JSON.parse(raw) as Fund
}

/**
 * 下载并保存基金数据到本地
 * @param {string} code 基金代码
 * @return {Promise<Fund>} 已保存的基金数据
 */
export async function downloadFundData(code: string): Promise<Fund> {
  const fund = await crawlFundData(code)
  fs.mkdirSync(FUND_DIR, { recursive: true })
  const file = path.join(FUND_DIR, `${code}.json`)
  fs.writeFileSync(file, JSON.stringify(fund, null, 2), 'utf-8')
  return fund
}
