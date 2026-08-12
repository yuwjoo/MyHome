/**
 * 交易回测模块 - 基金数据
 */

/**
 * 基金投资类型
 */
export type FundCategory =
  | 'stock' // 股票型
  | 'bond' // 债券型
  | 'hybrid' // 混合型
  | 'index' // 指数型
  | 'etf' // 交易型开放式指数基金
  | 'monetary' // 货币型
  | 'qdii' // 投资境外
  | 'fof' // 基金中的基金
  | 'commodity' // 商品型
  | 'other'

/**
 * 基金风险等级，R1 最低至 R5 最高
 */
export type FundRiskLevel = 1 | 2 | 3 | 4 | 5

/**
 * 申购费率阶梯，按单笔金额分档
 */
export interface PurchaseFeeTier {
  /**
   * 金额下限，含，单位元
   */
  minAmount: number
  /**
   * 金额上限，不含，单位元，null 表示无上限
   */
  maxAmount: number | null
  /**
   * 费率，小数表示，0.0015 即 0.15%，与 fixedFee 二选一
   */
  rate: number | null
  /**
   * 固定费用，单位元，大额申购适用
   */
  fixedFee: number | null
}

/**
 * 赎回费率分档，按持有天数分档
 */
export interface RedeemFeeTier {
  /**
   * 持有天数下限，含
   */
  minHoldingDays: number
  /**
   * 持有天数上限，不含，null 表示无上限
   */
  maxHoldingDays: number | null
  /**
   * 赎回费率，小数表示
   */
  rate: number
}

/**
 * 基金的费率与交易规则
 */
export interface FundTradeRule {
  /**
   * 申购费阶梯，按 minAmount 升序
   */
  purchaseTiers: PurchaseFeeTier[]
  /**
   * 赎回费分档，按 minHoldingDays 升序
   */
  redeemTiers: RedeemFeeTier[]
  /**
   * 管理费年费率，小数表示，已内含于净值，回测时不可重复扣减
   */
  managementFeeRate: number | null
  /**
   * 托管费年费率，小数表示，已内含于净值
   */
  custodianFeeRate: number | null
  /**
   * 销售服务费年费率，小数表示，C 类份额特有，已内含于净值
   */
  serviceFeeRate: number | null
  /**
   * 申购确认所需交易日数，境内基金通常为 1，QDII 通常为 2
   */
  purchaseConfirmDays: number
  /**
   * 赎回确认所需交易日数，通常为 1
   */
  redeemConfirmDays: number
}

/**
 * 单个交易日的净值快照，回测的核心数据
 */
export interface NavPoint {
  /**
   * 净值日期，格式 YYYY-MM-DD
   */
  date: string
  /**
   * 单位净值，通常保留 4 位小数，用于计算申购份额与赎回金额
   */
  unitNav: number
  /**
   * 当日涨跌幅，小数表示，0.0123 即上涨 1.23%
   *
   * 硬约束：必须为复权口径（已还原分红与拆分影响）。
   * 若取单位净值口径，分红除息日会出现虚假暴跌，导致策略信号失真。
   * 本模块不额外存复权净值字段，依赖数据源已提供正确口径的涨跌幅。
   */
  dailyChangeRate: number | null
}

/**
 * 分红记录
 */
export interface DividendRecord {
  /**
   * 权益登记日，格式 YYYY-MM-DD，持有至该日收盘方享有本次分红
   */
  registrationDate: string
  /**
   * 除息日，格式 YYYY-MM-DD，当日单位净值扣除分红金额
   */
  exDividendDate: string
  /**
   * 每份分红金额，单位元
   */
  amountPerShare: number
  /**
   * 现金红利发放日，格式 YYYY-MM-DD
   */
  payableDate: string | null
}

/**
 * 基金
 */
export interface Fund {
  /**
   * 基金代码
   */
  code: string
  /**
   * 基金全称，基金合同的法定名称
   */
  fullName: string
  /**
   * 基金简称，由官方数据源披露
   */
  shortName: string
  /**
   * 投资类型
   */
  category: FundCategory
  /**
   * 基金公司名称
   */
  company: string
  /**
   * 成立日期，格式 YYYY-MM-DD
   */
  establishedDate: string
  /**
   * 业绩比较基准描述
   */
  benchmark: string | null
  /**
   * 最新披露规模，单位亿元
   */
  scale: number | null
  /**
   * 规模对应的披露日期，格式 YYYY-MM-DD
   */
  scaleDate: string | null
  /**
   * 现任基金经理，可能多人共管
   */
  managers: string[]
  /**
   * 风险等级，R1 最低至 R5 最高
   */
  riskLevel: FundRiskLevel | null
  /**
   * 费率与交易规则
   */
  tradeRule: FundTradeRule
  /**
   * 净值点序列，按日期升序
   */
  points: NavPoint[]
  /**
   * 分红记录，按 registrationDate 升序
   */
  dividends: DividendRecord[]
}
