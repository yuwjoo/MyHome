/**
 * 基金数据解析
 */

import type { CheerioAPI } from 'cheerio'
import type {
  FundCategory,
  FundRiskLevel,
  FundTradeRule,
  NavPoint,
  DividendRecord,
  PurchaseFeeTier,
  RedeemFeeTier,
} from '../../types/fund'
import type { ParsedProfile } from '../../types/fund/crawler'

/**
 * 从概况页解析基本档案
 * @param {CheerioAPI} $ cheerio 文档对象
 * @return {ParsedProfile} 基本档案数据
 */
export function parseProfile($: CheerioAPI): ParsedProfile {
  const text = (sel: string): string => $(sel).first().text().trim()
  const fullName = text('.fundDetail-title h1') || text('h1') || ''
  const shortName = text('.fundDetail-title .shortName') || fullName
  const company = text('a[href*="eastmoney.com"]') || text('.info-aijiarl a') || ''

  // 概况表通常以「标签 - 值」成对出现，整段文本后用正则按标签提取值
  const blob = $('.section, .basic-info, table').text()
  const pick = (label: string): string => {
    const m = blob.match(new RegExp(`${label}\\s*[:：]?\\s*([^\\n]+)`))
    return m ? m[1].trim() : ''
  }

  let category: FundCategory = 'other'
  const catText = pick('基金类型') || pick('类型')
  if (catText.includes('股票')) category = 'stock'
  else if (catText.includes('债券')) category = 'bond'
  else if (catText.includes('混合')) category = 'hybrid'
  else if (catText.includes('指数')) category = 'index'
  else if (catText.includes('ETF') || catText.includes('交易型')) category = 'etf'
  else if (catText.includes('货币')) category = 'monetary'
  else if (catText.includes('QDII') || catText.includes('海外')) category = 'qdii'
  else if (catText.includes('FOF')) category = 'fof'
  else if (catText.includes('商品') || catText.includes('黄金')) category = 'commodity'

  const benchmarkRaw = pick('业绩比较基准') || pick('跟踪标的')
  const scaleRaw = pick('最新规模') || pick('资产规模')
  const scale = scaleRaw ? parseFloat(scaleRaw.replace(/[^\d.]/g, '')) || null : null
  const scaleDate = pick('规模日期') || pick('份额规模日期') || null
  const managers = (pick('基金经理') || '')
    .split(/[、,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const riskText = pick('风险等级') || pick('风险')
  const riskMatch = riskText.match(/R?([1-5])/)
  const riskLevel: FundRiskLevel | null = riskMatch
    ? (parseInt(riskMatch[1] ?? '0', 10) as FundRiskLevel)
    : null

  return {
    fullName: fullName || '',
    shortName: shortName || fullName || '',
    category,
    company,
    establishedDate: pick('成立日期') || pick('成立时间'),
    benchmark: benchmarkRaw || null,
    scale,
    scaleDate,
    managers,
    riskLevel,
  }
}

/**
 * 从费率页解析交易规则
 * @param {CheerioAPI} $ cheerio 文档对象
 * @return {FundTradeRule} 费率与交易规则
 */
export function parseTradeRule($: CheerioAPI): FundTradeRule {
  const purchaseTiers: PurchaseFeeTier[] = []
  const redeemTiers: RedeemFeeTier[] = []

  $('.buyfee table tbody tr, .purchase-fee tbody tr').each((_: number, tr: any) => {
    const cells = $(tr)
      .find('td')
      .map((__: number, td: any) => $(td).text().trim())
      .get()
    const rateCell = cells.find((c: string) => c.includes('%'))
    if (!rateCell) return
    const rateMatch = rateCell.match(/([\d.]+)\s*%/)
    const rate = rateMatch ? parseFloat(rateMatch[1] ?? '0') / 100 : null
    const range = cells[0] ?? ''
    const min = parseFloat(range.replace(/[^\d.]/g, '')) || 0
    purchaseTiers.push({
      minAmount: min,
      maxAmount: null,
      rate: rate !== null ? rate : null,
      fixedFee: null,
    })
  })

  $('.sellfee table tbody tr, .redeem-fee tbody tr').each((_: number, tr: any) => {
    const cells = $(tr)
      .find('td')
      .map((__: number, td: any) => $(td).text().trim())
      .get()
    const days = cells[0]?.match(/(\d+)/)
    const rateCell = cells.find((c: string) => c.includes('%')) ?? cells[cells.length - 1]
    const rateMatch = rateCell ? rateCell.match(/([\d.]+)\s*%/) : null
    const rate = rateMatch ? parseFloat(rateMatch[1] ?? '0') / 100 : null
    if (!days || rate === null) return
    redeemTiers.push({
      minHoldingDays: parseInt(days[1] ?? '0', 10),
      maxHoldingDays: null,
      rate: rate,
    })
  })

  const opText = $('.feeinfo, .operation-fee, .fundfee').text()
  const extractRate = (label: string): number | null => {
    const idx = opText.indexOf(label)
    if (idx < 0) return null
    const m = opText.slice(idx + label.length).match(/([\d.]+)\s*%/)
    return m ? parseFloat(m[1] ?? '0') / 100 : null
  }
  const managementFeeRate = extractRate('管理费率')
  const custodianFeeRate = extractRate('托管费率')
  const serviceFeeRate = extractRate('销售服务费率')

  return {
    purchaseTiers,
    redeemTiers,
    managementFeeRate,
    custodianFeeRate,
    serviceFeeRate,
    // QDII 确认更长，精确值应来自接口/页面，此处默认
    purchaseConfirmDays: 1,
    redeemConfirmDays: 1,
  }
}

/**
 * 从净值明细页解析净值序列
 * @param {CheerioAPI} $ cheerio 文档对象
 * @return {NavPoint[]} 净值点序列
 */
export function parseNavPoints($: CheerioAPI): NavPoint[] {
  const points: NavPoint[] = []
  $('.tablePage table tbody tr, .lsjz-table tbody tr').each((_: number, tr: any) => {
    const cells = $(tr)
      .find('td')
      .map((__: number, td: any) => $(td).text().trim())
      .get()
    // 期望列：[日期, 单位净值, 累计净值, 日增长率, ...]
    const date = cells[0]
    const unitNav = parseFloat((cells[1] || '').replace(/[^\d.]/g, ''))
    if (!date || isNaN(unitNav)) return
    const changeRaw = cells[3] || ''
    const changeRate = changeRaw === '' ? null : parseFloat(changeRaw) / 100
    points.push({
      date,
      unitNav,
      dailyChangeRate: changeRate !== null && !isNaN(changeRate) ? changeRate : null,
    })
  })
  // 按日期升序
  return points.sort((a, b) => (a.date < b.date ? -1 : 1))
}

/**
 * 从分红页解析分红记录
 * @param {CheerioAPI} $ cheerio 文档对象
 * @return {DividendRecord[]} 分红记录列表
 */
export function parseDividends($: CheerioAPI): DividendRecord[] {
  const list: DividendRecord[] = []
  $('.tablePage table tbody tr, .fhsp-table tbody tr').each((_: number, tr: any) => {
    const cells = $(tr)
      .find('td')
      .map((__: number, td: any) => $(td).text().trim())
      .get()
    // 期望列：[权益登记日, 除息日, 每份分红, 现金发放日, ...]
    const registrationDate = cells[0]
    const exDividendDate = cells[1]
    const amount = parseFloat((cells[2] || '').replace(/[^\d.]/g, ''))
    if (!registrationDate || isNaN(amount)) return
    list.push({
      registrationDate,
      exDividendDate: exDividendDate || registrationDate,
      amountPerShare: amount,
      payableDate: cells[3] || null,
    })
  })
  return list
}
