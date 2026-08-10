/**
 * 交易回测模块 - 交易与持仓类型
 *
 * 【核心模型】订单（Order）是唯一真相源，持仓（Position）由订单推导。
 * 理由：支持造物主回拨 frontier 后重新推演，若持仓是可变字段会与历史不一致。
 *
 * 【生命周期】下单 submitted -> 确认 confirmed -> （赎回还需）到账 settled
 * 这三个阶段跨越多个交易日，中间存在「在途资金」，策略必须能感知，
 * 否则会误判可用现金而重复下单。
 */

import type {
  FundCode,
  LotId,
  Money,
  NetValue,
  Nullable,
  OrderId,
  Rate,
  Shares,
  Timestamp,
  TradingDate,
} from './common'

/** 交易方向 */
export type TradeSide =
  | 'purchase' // 申购（买入）
  | 'redeem' // 赎回（卖出）

/**
 * 订单状态机。
 * submitted -> confirmed -> settled 为正常流转；
 * 任一阶段可转 cancelled（用户撤单，仅限确认前）或 failed（限购、余额不足等）。
 */
export type OrderStatus =
  | 'submitted' // 已提交，等待确认。资金已冻结但份额未到手
  | 'confirmed' // 已确认。申购份额已入账；赎回份额已扣除但资金在途
  | 'settled' // 已结算。赎回资金已到账。申购单确认即视为 settled
  | 'cancelled' // 已撤销
  | 'failed' // 失败（限购超额、可用现金不足、基金暂停申赎等）

/** 订单失败原因 */
export type OrderFailReason =
  | 'insufficientCash' // 可用现金不足
  | 'insufficientShares' // 可用份额不足
  | 'belowMinAmount' // 低于最低申购金额
  | 'exceedDailyLimit' // 超过单日限购额度
  | 'fundSuspended' // 基金暂停申赎
  | 'noNavData' // 该日无净值数据（如基金尚未成立）
  | 'belowMinHolding' // 赎回后剩余份额低于最低保留份额

/** 订单发起来源 */
export type OrderOrigin =
  | 'manual' // 用户手动下单
  | 'strategy' // 采纳策略建议后下单

/**
 * 交易订单。这是自选组内唯一被持久化的交易事实。
 *
 * 【不可变原则】订单一旦 confirmed 就不应被修改。
 * 造物主回拨 frontier 时，直接物理删除 frontier 之后的订单（按用户确认的方案），
 * 而非修改已有订单。
 */
export interface Order {
  id: OrderId
  /** 标的基金 */
  fundCode: FundCode
  /** 交易方向 */
  side: TradeSide
  /** 当前状态 */
  status: OrderStatus

  // ---------- 提交阶段 ----------
  /**
   * 下单的精确时刻。
   * 用于判断是否早于该基金的 cutOffTime，进而决定确认日。
   */
  submittedAt: Timestamp
  /** 下单所在的自然日 */
  submittedDate: TradingDate
  /**
   * 申购金额。仅 side='purchase' 时有值。
   * 这是含申购费的总付出金额（即从现金账户扣除的数额）。
   */
  requestAmount: Nullable<Money>
  /**
   * 赎回份额。仅 side='redeem' 时有值。
   */
  requestShares: Nullable<Shares>
  /**
   * 指定赎回的持仓批次。为空则按组配置的 lotStrategy（默认 FIFO）自动选择。
   * 允许策略精确指定要卖哪一批，这对分批建仓的马丁策略很关键。
   */
  targetLotIds: Nullable<LotId[]>

  // ---------- 确认阶段 ----------
  /**
   * 份额确认日期。按基金 tradingRule 推算：
   * 若 submittedAt 早于 cutOffTime，则为下单当日（若为交易日）对应的净值日，
   * 否则顺延一个交易日。
   */
  confirmDate: Nullable<TradingDate>
  /** 确认时采用的单位净值 */
  confirmNav: Nullable<NetValue>
  /**
   * 实际成交份额。
   * 申购：(requestAmount - fee) / confirmNav
   * 赎回：即 requestShares
   */
  confirmedShares: Nullable<Shares>
  /**
   * 实际成交金额（不含费用的净额）。
   * 申购：requestAmount - fee
   * 赎回：requestShares * confirmNav
   */
  confirmedAmount: Nullable<Money>

  // ---------- 费用 ----------
  /** 实际收取的费用，单位元 */
  fee: Nullable<Money>
  /** 实际适用的费率，用于展示与审计 */
  feeRate: Nullable<Rate>

  // ---------- 结算阶段（仅赎回） ----------
  /**
   * 赎回资金到账日期。从 confirmDate 起顺延 redeemSettleDays 个交易日。
   * 【易忽略】该日之前资金处于在途状态，不可用于再次申购。
   */
  settleDate: Nullable<TradingDate>
  /** 实际到账金额 = confirmedAmount - fee */
  settleAmount: Nullable<Money>

  // ---------- 元信息 ----------
  /** 下单来源 */
  origin: OrderOrigin
  /** 若来源为策略，记录是哪个策略给的建议，便于归因分析 */
  strategyId: Nullable<string>
  /** 失败原因，仅 status='failed' 时有值 */
  failReason: Nullable<OrderFailReason>
  /** 用户备注 */
  remark: Nullable<string>
}

/**
 * 持仓批次。每笔成功确认的申购生成一个批次。
 *
 * 【为什么需要批次】赎回费按持有天数分档（不足 7 天收 1.5%），
 * 必须知道每一份额是哪天买的才能算对费用。
 * 简单地记录「总份额 + 平均成本」会导致费用计算错误。
 */
export interface PositionLot {
  id: LotId
  fundCode: FundCode
  /** 产生该批次的申购订单 */
  sourceOrderId: OrderId
  /**
   * 建仓日期，即份额确认日。
   * 持有天数从这一天起算（自然日，非交易日）。
   */
  openDate: TradingDate
  /** 建仓时的单位净值，即该批次的成本净值 */
  costNav: NetValue
  /** 初始份额 */
  initialShares: Shares
  /**
   * 当前剩余份额。赎回时按 lotStrategy 从各批次扣减。
   * 为 0 表示该批次已清空，但仍保留记录用于历史追溯。
   */
  remainingShares: Shares
  /**
   * 该批次分摊的申购费。
   * 计算已实现盈亏时需扣除，否则会高估收益。
   */
  allocatedPurchaseFee: Money
}

/** 批次扣减规则 */
export type LotSelectionStrategy =
  | 'fifo' // 先进先出。中国公募基金实际普遍采用
  | 'lifo' // 后进先出
  | 'highestCost' // 优先卖成本最高的（税务/止损优化）
  | 'lowestCost' // 优先卖成本最低的（锁定利润）
  | 'manual' // 由订单的 targetLotIds 显式指定

/**
 * 某只基金的持仓聚合视图。
 * 【推导产物】不持久化，由订单流水实时计算得出。
 */
export interface Position {
  fundCode: FundCode
  /** 构成该持仓的所有批次（含已清空的，便于追溯） */
  lots: PositionLot[]
  /** 已确认的可用份额 = 各批次 remainingShares 之和 */
  totalShares: Shares
  /**
   * 在途申购份额。已下单但尚未确认，此时份额未到账。
   * 【易忽略】策略若把这部分当成已持有，会重复加仓。
   */
  pendingPurchaseShares: Shares
  /** 在途赎回份额。已申请赎回但未确认，这部分不可再次赎回 */
  pendingRedeemShares: Shares
  /**
   * 持仓总成本 = 各批次 (costNav * remainingShares) 之和 + 分摊申购费。
   */
  totalCost: Money
  /** 摊薄成本净值 = totalCost / totalShares */
  averageCostNav: NetValue
  /** 按 viewpoint 当日净值计算的市值 */
  marketValue: Money
  /** 浮动盈亏 = marketValue - totalCost */
  unrealizedProfit: Money
  /** 浮动盈亏率 = unrealizedProfit / totalCost */
  unrealizedProfitRate: Rate
  /**
   * 已实现盈亏。历史上该基金所有赎回操作的累计盈亏（已扣费）。
   */
  realizedProfit: Money
}

/**
 * 现金账户快照。
 *
 * 【三态现金】必须区分，否则会出现「明明显示有钱却买不了」的 bug：
 * - available：可立即用于申购
 * - frozen：已下申购单但未确认，已扣但份额未到
 * - inTransit：赎回已确认但资金未到账
 */
export interface CashAccount {
  /** 可用现金 */
  available: Money
  /** 申购冻结中的现金 */
  frozen: Money
  /** 赎回在途资金 */
  inTransit: Money
  /** 现金总额 = available + frozen + inTransit */
  total: Money
}

/** 资金流水类型 */
export type CashFlowType =
  | 'deposit' // 外部注资
  | 'withdraw' // 外部提取
  | 'purchaseFreeze' // 申购冻结
  | 'purchaseSettle' // 申购确认扣款
  | 'purchaseRefund' // 申购失败退款
  | 'redeemArrive' // 赎回到账
  | 'dividendCash' // 现金分红入账

/**
 * 资金流水记录。
 * 【为什么需要】现金余额也应可推导可审计。
 * 外部注资/提取是无法由订单推导的独立事实，必须单独记录。
 */
export interface CashFlow {
  id: string
  type: CashFlowType
  /** 发生日期 */
  date: TradingDate
  /** 发生时刻 */
  occurredAt: Timestamp
  /** 金额。正数为流入，负数为流出 */
  amount: Money
  /** 关联订单，外部注资等场景为 null */
  relatedOrderId: Nullable<OrderId>
  remark: Nullable<string>
}
