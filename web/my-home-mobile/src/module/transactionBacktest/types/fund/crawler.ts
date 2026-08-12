/**
 * 爬虫相关类型
 */

import type { FundCategory, FundRiskLevel } from '.'

/** 
 * 基金列表搜索结果项
 */
export interface FundListItem {
  /**
   * 基金代码
   */
  code: string
  /**
   * 基金名称
   */
  name: string
  /**
   * 基金类型文本
   */
  type: string
  /**
   * 基金简称
   */
  shortName?: string
}

/** 
 * 列表搜索分页返回
 */
export interface FundListPage {
  /**
   * 本页基金项
   */
  items: FundListItem[]
  /**
   * 总记录数
   */
  total: number
  /**
   * 当前页码
   */
  pageIndex: number
  /**
   * 每页大小
   */
  pageSize: number
}

/** 
 * 基本档案解析结果
 */
export interface ParsedProfile {
  /**
   * 基金全称
   */
  fullName: string
  /**
   * 基金简称
   */
  shortName: string
  /**
   * 投资类型
   */
  category: FundCategory
  /**
   * 基金公司
   */
  company: string
  /**
   * 成立日期
   */
  establishedDate: string
  /**
   * 业绩比较基准
   */
  benchmark: string | null
  /**
   * 最新规模
   */
  scale: number | null
  /**
   * 规模披露日期
   */
  scaleDate: string | null
  /**
   * 基金经理列表
   */
  managers: string[]
  /**
   * 风险等级
   */
  riskLevel: FundRiskLevel | null
}
