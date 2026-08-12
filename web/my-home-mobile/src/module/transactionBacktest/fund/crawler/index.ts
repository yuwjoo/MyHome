/**
 * 基金爬虫
 */

import type { Fund } from '../../types/fund'
import type { FundListItem, FundListPage } from '../../types/fund/crawler'
import { parseProfile, parseTradeRule, parseNavPoints, parseDividends } from './parser'
import { ttjjRequest } from './request'
import { loadHtml } from './utils'

/**
 * 获取基金列表
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
  const url = 'https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAjax'
  const resp = await ttjjRequest.get<{
    TotalCount?: number
    Data?: Array<{ CODE: string; NAME: string; FundType?: string; SHORTNAME?: string }>
  }>(url, {
    params: { m: 1, key: keyword, pageIndex, pageSize },
  })

  const items: FundListItem[] = (resp.data.Data ?? []).map((d) => ({
    code: d.CODE, // 基金代码
    name: d.NAME, // 基金名称
    type: d.FundType ?? '', // 基金类型
    shortName: d.SHORTNAME || undefined, // 基金简称
  }))

  return {
    items,
    total: resp.data.TotalCount ?? items.length,
    pageIndex,
    pageSize,
  }
}

/**
 * 获取基金明细
 * @param {string} code 6 位基金代码
 * @return {Promise<Fund>} 完整基金数据
 */
export async function fetchFundData(code: string): Promise<Fund> {
  const [profile$, tradeRule$, nav$, dividend$] = await Promise.all([
    loadHtml(ttjjRequest, `https://fundf10.eastmoney.com/jbgk_${code}.html`), // 基本概况页
    loadHtml(ttjjRequest, `https://fundf10.eastmoney.com/jjfl_${code}.html`), // 费率页
    loadHtml(ttjjRequest, `https://fundf10.eastmoney.com/jjjz_${code}.html`), // 净值明细页
    loadHtml(ttjjRequest, `https://fundf10.eastmoney.com/fhsp_${code}.html`).catch(() => null), // 分红页（失败可忽略）
  ])

  const profile = parseProfile(profile$) // 基本信息
  const tradeRule = parseTradeRule(tradeRule$) // 交易规则
  const points = parseNavPoints(nav$) // 净值序列
  const dividends = dividend$ ? parseDividends(dividend$) : [] // 分红记录

  return {
    code, // 基金代码
    fullName: profile.fullName, // 基金全称
    shortName: profile.shortName, // 基金简称
    category: profile.category, // 投资类型
    company: profile.company, // 基金公司
    establishedDate: profile.establishedDate, // 成立日期
    benchmark: profile.benchmark, // 业绩比较基准
    scale: profile.scale, // 最新规模
    scaleDate: profile.scaleDate, // 规模披露日期
    managers: profile.managers, // 基金经理列表
    riskLevel: profile.riskLevel, // 风险等级
    tradeRule, // 费率与交易规则
    points, // 净值序列
    dividends, // 分红记录
  }
}
