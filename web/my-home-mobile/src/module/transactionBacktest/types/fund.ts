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
 * 基金基本信息
 */
export interface FundProfile {
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
   * 档案最后更新时间，Unix 毫秒时间戳
   */
  updatedAt: number
}

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
 * 基金交易规则
 */
export interface FundTradingRule {
  /**
   * 基金代码
   */
  code: string

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
   * 当日交易截止时刻，格式 HH:mm:ss，默认 15:00:00
   *
   * 此前提交按 T 日净值确认，此后顺延一个交易日
   */
  cutOffTime: string
  /**
   * 申购确认所需交易日数，境内基金通常为 1，QDII 通常为 2
   */
  purchaseConfirmDays: number
  /**
   * 赎回确认所需交易日数，通常为 1
   */
  redeemConfirmDays: number
  /**
   * 赎回资金到账所需交易日数，从确认日起算
   *
   * 境内股票型通常 3 日，QDII 可达 7 至 10 日。
   * 该期间资金既不在持仓也不可用，忽略会误判可用现金。
   */
  redeemSettleDays: number

  /**
   * 首次申购最低金额，单位元
   */
  minFirstPurchase: number | null
  /**
   * 追加申购最低金额，单位元
   */
  minAdditionalPurchase: number | null
  /**
   * 最低赎回份额
   */
  minRedeemShares: number | null
  /**
   * 单日单账户申购限额，单位元，null 表示不限购
   */
  dailyPurchaseLimit: number | null
  /**
   * 最低保留份额，赎回后余额低于此值时须全部赎回
   */
  minHoldingShares: number | null

  /**
   * 规则最后更新时间，Unix 毫秒时间戳
   */
  updatedAt: number
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
   * 累计净值，等于单位净值加历史累计每份分红
   *
   * 单位净值会因分红下跌，直接用它计算收益会低估
   */
  accumulatedNav: number
  /**
   * 当日涨跌幅，小数表示，0.0123 即上涨 1.23%
   *
   * 应基于复权净值计算，否则分红日会出现虚假暴跌
   */
  dailyChangeRate: number | null
  /**
   * 复权净值，已还原分红与拆分影响的连续价格序列
   *
   * 建议由数据层预先算好，涨跌幅与技术指标均基于此字段
   */
  adjustedNav: number | null
}

/**
 * 基金净值序列
 *
 * 按日存储，10 年约 2400 条。内部须保持 date 升序，
 * 并建立 date 到 index 的映射，否则逐日推演会退化为 O(n²)。
 */
export interface NavSeries {
  /**
   * 基金代码
   */
  code: string
  /**
   * 净值点，按日期升序
   */
  points: NavPoint[]
  /**
   * 序列首个日期，格式 YYYY-MM-DD
   */
  startDate: string | null
  /**
   * 序列最后日期，格式 YYYY-MM-DD
   */
  endDate: string | null
  /**
   * 数据最后同步时间，Unix 毫秒时间戳
   */
  syncedAt: number
}

// ============================================================
// 4. 利益分配事件（分红 / 拆分）
// ============================================================

/**
 * 分红记录
 *
 * 分红后单位净值下跌，不做还原会被误判为亏损
 */
export interface DividendRecord {
  /**
   * 基金代码
   */
  code: string
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
 * 份额拆分记录
 *
 * 拆分后份额增加、净值等比下降，总资产不变
 */
export interface SplitRecord {
  /**
   * 基金代码
   */
  code: string
  /**
   * 拆分实施日，格式 YYYY-MM-DD
   */
  date: string
  /**
   * 拆分比例，2 表示 1 份拆为 2 份
   */
  ratio: number
}

// ============================================================
// 5. 聚合与仓库
// ============================================================

/**
 * 单只基金的全量数据
 *
 * navSeries 可能有数千条记录，仓库应按 code 分片存储并对其做懒加载
 */
export interface FundData {
  profile: FundProfile
  tradingRule: FundTradingRule | null
  navSeries: NavSeries
  dividends: DividendRecord[]
  splits: SplitRecord[]
}

/**
 * 全局基金数据仓库，所有自选组共享同一实例
 */
export interface FundRepository {
  /**
   * 以基金代码为键的数据表
   */
  funds: Record<string, FundData>
  /**
   * 已收录的基金代码列表
   */
  codes: string[]
}
