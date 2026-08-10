/**
 * 交易回测模块 - 基金数据类型
 *
 * 【归属原则】基金数据是全局共享的客观事实，不属于任何自选组。
 * 组内只持有 FundCode 引用。理由：同一只基金在 2024-03-01 的净值不会因组不同而不同，
 * 存副本会造成冗余且无法统一更新。
 *
 * 【字段取舍】只收录"绝大多数基金都公开且常态更新"的字段。
 * 已刻意排除：重仓股/行业分布（季度披露、数据源难拿）、
 * 夏普比/最大回撤等统计指标（可由净值序列推导，不作为存储字段，避免脏数据）。
 */

import type {
  FundCode,
  Money,
  NetValue,
  Nullable,
  Rate,
  Timestamp,
  TimeOfDay,
  TradingDate,
} from './common'

/** 基金投资类型。依据中国证监会《公开募集证券投资基金运作管理办法》的常见分类 */
export type FundCategory =
  | 'stock' // 股票型：股票资产 >= 80%
  | 'bond' // 债券型：债券资产 >= 80%
  | 'hybrid' // 混合型
  | 'index' // 指数型（含增强指数）
  | 'etf' // 交易型开放式指数基金
  | 'monetary' // 货币型
  | 'qdii' // 合格境内机构投资者（投资境外）
  | 'fof' // 基金中的基金
  | 'commodity' // 商品型（如黄金 ETF）
  | 'other'

/** 基金运作状态 */
export type FundStatus =
  | 'normal' // 正常开放申赎
  | 'suspendPurchase' // 暂停申购（如限购、封闭期）
  | 'suspendRedeem' // 暂停赎回
  | 'suspendBoth' // 暂停申赎
  | 'liquidated' // 已清盘

/** 分红方式 */
export type DividendMethod =
  | 'cash' // 现金分红
  | 'reinvest' // 红利再投资

// ============================================================
// 基础信息
// ============================================================

/**
 * 基金静态基础信息。
 * 这部分数据变动极少，可长期缓存。
 */
export interface FundProfile {
  /** 基金代码，全局唯一主键 */
  code: FundCode
  /** 基金全称 */
  fullName: string
  /** 基金简称，UI 展示用 */
  shortName: string
  /** 投资类型 */
  category: FundCategory
  /** 基金公司名称 */
  company: string
  /** 成立日期。早于此日期无净值数据，回测起点不能早于它 */
  establishedDate: TradingDate
  /** 当前运作状态 */
  status: FundStatus
  /**
   * 业绩比较基准描述文本。
   * 说明：这是自由文本（如"沪深300指数收益率*80%+中债总指数*20%"），
   * 无法结构化，仅供展示，不参与计算。
   */
  benchmark: Nullable<string>
  /** 最新披露的基金规模，单位「亿元」。季度披露，存在滞后 */
  scale: Nullable<number>
  /** 规模数据对应的披露日期 */
  scaleDate: Nullable<TradingDate>
  /** 当前基金经理姓名列表。可能多人共管 */
  managers: string[]
  /** 风险等级，R1（低）~ R5（高） */
  riskLevel: Nullable<1 | 2 | 3 | 4 | 5>
  /** 该基金档案的最后更新时间 */
  updatedAt: Timestamp
}

// ============================================================
// 净值走势数据
// ============================================================

/**
 * 单个交易日的净值快照。这是回测的核心数据，缺失即无法推演。
 */
export interface NavPoint {
  /** 净值日期 */
  date: TradingDate
  /**
   * 单位净值。用于计算申购份额与赎回金额。
   * 公式：申购份额 = 净申购金额 / 单位净值
   */
  unitNav: NetValue
  /**
   * 累计净值 = 单位净值 + 历史累计每份分红。
   * 用于衡量真实收益率（单位净值会因分红下跌，直接用它算收益会低估）。
   */
  accumulatedNav: NetValue
  /**
   * 当日涨跌幅，小数表示（0.0123 = 涨 1.23%）。
   * 注意：该值应基于复权净值计算，否则分红日会出现虚假暴跌。
   */
  dailyChangeRate: Nullable<Rate>
  /**
   * 复权净值。已还原分红与拆分影响的连续价格序列。
   * 强烈建议由数据层预先计算好，所有涨跌幅/技术指标均基于此字段，
   * 否则遇到分红除息日会算出错误的收益。
   */
  adjustedNav: Nullable<NetValue>
}

/**
 * 基金的完整净值序列。
 *
 * 【性能考量】按日存储，10 年约 2400 条。
 * 内部应保证按 date 升序排列，并建立 date -> index 的映射以支持 O(1) 查找，
 * 否则每次策略取值都做线性扫描，逐日推演时会退化成 O(n²)。
 */
export interface NavSeries {
  code: FundCode
  /** 按日期升序排列的净值点 */
  points: NavPoint[]
  /** 序列覆盖的首个日期 */
  startDate: Nullable<TradingDate>
  /** 序列覆盖的最后日期 */
  endDate: Nullable<TradingDate>
  /** 数据最后同步时间 */
  syncedAt: Timestamp
}

// ============================================================
// 费率规则
// ============================================================

/**
 * 申购费率阶梯。按单笔申购金额分档。
 * 现实规则：金额越大费率越低，超过某阈值（常见 500 万）改为按笔收取固定费用。
 */
export interface PurchaseFeeTier {
  /** 金额下限，含。单位元 */
  minAmount: Money
  /** 金额上限，不含。null 表示无上限 */
  maxAmount: Nullable<Money>
  /**
   * 费率，小数表示。与 fixedFee 二选一。
   * 例：0.0015 表示 0.15%（即常见的一折费率）
   */
  rate: Nullable<Rate>
  /** 固定费用，单位元。大额申购常见「每笔 1000 元」 */
  fixedFee: Nullable<Money>
}

/**
 * 赎回费率分档。按持有天数分档。
 *
 * 【重要】这是马丁类高频策略回测结果是否失真的关键。
 * 现实规则：持有不足 7 天强制收取 1.5% 惩罚性赎回费（证监会强制规定），
 * 忽略此项会让频繁交易策略的回测结果显著偏乐观。
 */
export interface RedeemFeeTier {
  /** 持有天数下限，含 */
  minHoldingDays: number
  /** 持有天数上限，不含。null 表示无上限 */
  maxHoldingDays: Nullable<number>
  /** 赎回费率，小数表示 */
  rate: Rate
}

/**
 * 基金费率规则集合。
 */
export interface FundFeeRule {
  code: FundCode
  /** 申购费阶梯，按 minAmount 升序 */
  purchaseTiers: PurchaseFeeTier[]
  /** 赎回费分档，按 minHoldingDays 升序 */
  redeemTiers: RedeemFeeTier[]
  /**
   * 管理费年费率。已在净值中扣除，回测时**不应重复扣减**。
   * 仅作展示用途。
   */
  managementFeeRate: Nullable<Rate>
  /** 托管费年费率。同样已内含于净值，不重复扣减 */
  custodianFeeRate: Nullable<Rate>
  /**
   * 销售服务费年费率。C 类份额特有，已内含于净值。
   * 注意：C 类通常无申购费但有销售服务费，长期持有反而更贵。
   */
  serviceFeeRate: Nullable<Rate>
  updatedAt: Timestamp
}

// ============================================================
// 交易规则
// ============================================================

/**
 * 基金的申赎交易规则。
 * 这部分决定「什么时候能买、按哪天净值成交、什么时候到账」。
 */
export interface FundTradingRule {
  code: FundCode
  /**
   * 当日交易截止时刻，默认 15:00:00。
   * 在此之前提交按 T 日净值确认，之后按 T+1 日净值确认。
   */
  cutOffTime: TimeOfDay
  /**
   * 申购确认所需交易日数。境内基金通常为 1（T+1 确认份额）。
   * QDII 因跨时区结算通常为 2。
   */
  purchaseConfirmDays: number
  /**
   * 赎回确认所需交易日数。通常为 1。
   */
  redeemConfirmDays: number
  /**
   * 赎回资金到账所需交易日数（从确认日起算）。
   * 境内股票型通常 T+3 到账，QDII 可达 T+7~T+10。
   * 【易忽略】这段时间资金既不在持仓也不可用，策略若不考虑会误判可用现金。
   */
  redeemSettleDays: number
  /** 首次申购最低金额，单位元 */
  minFirstPurchase: Nullable<Money>
  /** 追加申购最低金额 */
  minAdditionalPurchase: Nullable<Money>
  /** 最低赎回份额 */
  minRedeemShares: Nullable<import('./common').Shares>
  /**
   * 单日单账户申购限额。null 表示不限购。
   * 现实中热门基金常有限购（如每日限 1000 元）。
   */
  dailyPurchaseLimit: Nullable<Money>
  /** 最低保留份额。赎回后剩余份额低于此值时必须全部赎回 */
  minHoldingShares: Nullable<import('./common').Shares>
  updatedAt: Timestamp
}

// ============================================================
// 分红与拆分
// ============================================================

/**
 * 分红记录。
 * 【为什么必须处理】分红后单位净值会下跌，若不还原会被误判为亏损。
 */
export interface DividendRecord {
  code: FundCode
  /** 权益登记日：持有到该日收盘才享有本次分红 */
  registrationDate: TradingDate
  /** 除息日：当日单位净值扣除分红金额 */
  exDividendDate: TradingDate
  /** 每份分红金额，单位元 */
  amountPerShare: Money
  /** 现金红利发放日 */
  payableDate: Nullable<TradingDate>
}

/**
 * 份额拆分/折算记录。
 * 拆分后份额增加、净值等比下降，总资产不变。
 */
export interface SplitRecord {
  code: FundCode
  /** 拆分实施日 */
  date: TradingDate
  /** 拆分比例。2 表示 1 份拆为 2 份，净值减半 */
  ratio: number
}

// ============================================================
// 聚合视图
// ============================================================

/**
 * 一只基金的全量数据聚合。
 *
 * 【使用建议】不要在组件里直接持有整个对象。
 * navSeries 可能有数千条记录，全局仓库应按 code 分片存储，
 * 并对 navSeries 做懒加载（用到某只基金才拉取其净值）。
 */
export interface FundData {
  profile: FundProfile
  navSeries: NavSeries
  feeRule: Nullable<FundFeeRule>
  tradingRule: Nullable<FundTradingRule>
  dividends: DividendRecord[]
  splits: SplitRecord[]
}

/**
 * 全局基金数据仓库。所有自选组共享同一份实例。
 */
export interface FundRepository {
  /** 以基金代码为键的数据表 */
  funds: Record<FundCode, FundData>
  /** 已收录的基金代码列表 */
  codes: FundCode[]
}
