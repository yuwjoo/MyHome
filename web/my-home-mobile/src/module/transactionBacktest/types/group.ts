/**
 * 交易回测模块 - 自选组（平行世界）类型
 *
 * 【核心概念：双时间轴】
 * - frontier（经历到的时间）：这个平行世界已推演到的最前沿。原则上只能正向流动。
 * - viewpoint（当前所处时间）：用户此刻在观察哪一天。可以是过去，但恒有 viewpoint <= frontier。
 *
 * 【不变式】必须在运行时强制校验，违反即为 bug：
 *   1. viewpoint <= frontier （不能看未来，时光机只能去过去）
 *   2. 所有 Order.submittedDate <= frontier （不存在未来的交易）
 *   3. viewpoint < frontier 时禁止一切写操作（回到过去只能看，不能改）
 *
 * 【造物主回拨】唯一能让 frontier 后退的操作，属于元操作（跳出世界规则之外）。
 * 按需求确认，回拨时物理删除区间内的订单，不可恢复。
 */

import type {
  FundCode,
  GroupId,
  Money,
  Nullable,
  StrategyId,
  Timestamp,
  TradingDate,
  UUID,
} from './common'
import type {
  CashAccount,
  CashFlow,
  LotSelectionStrategy,
  Order,
  Position,
} from './trade'

/**
 * 分红方式。这是投资者的选择，不属于基金自身的客观属性。
 */
export type DividendMethod =
  | 'cash' // 现金分红：红利转入现金账户
  | 'reinvest' // 红利再投资：红利自动转为份额

/**
 * 组的时间状态。
 *
 * 【设计说明】把两个时间打包成独立对象而非平铺在 Group 上，
 * 是为了让「时间推进」「时光回溯」这类操作有明确的作用域，便于做不变式校验。
 */
export interface GroupTimeline {
  /**
   * 世界起点。推演从这一天开始，早于此日期的行情不可见。
   */
  originDate: TradingDate
  /**
   * 已经历到的时间前沿。
   * 单调递增（造物主回拨除外）。这是"现在"，代表世界的真实进度。
   */
  frontier: TradingDate
  /**
   * 当前观察时间点。恒满足 viewpoint <= frontier。
   * 该值决定组内一切可见数据的截止范围，但**不影响** frontier。
   */
  viewpoint: TradingDate
  /**
   * 世界终点。推演到此日期后不能再前进。
   * null 表示无限制（推到最新行情为止）。
   */
  endDate: Nullable<TradingDate>
}

/**
 * 时间模式。派生自 timeline，供 UI 快速判断当前交互形态。
 */
export type TimeMode =
  | 'present' // viewpoint === frontier，处于"现在"，可正常交易
  | 'past' // viewpoint < frontier，处于"过去"，只读观察

/**
 * 组配置。影响推演行为的可调参数。
 */
export interface GroupConfig {
  /** 初始资金 */
  initialCapital: Money
  /**
   * 赎回时的批次扣减规则。默认 fifo。
   * 订单可通过 targetLotIds 覆盖此设置。
   */
  lotStrategy: LotSelectionStrategy
  /**
   * 是否启用真实费用计算。
   * 关闭后所有申赎零费用——仅用于快速验证策略逻辑，
   * 【警告】关闭时回测收益会显著偏乐观，尤其是高频策略。
   */
  enableFee: boolean
  /**
   * 是否模拟 T+N 确认延迟。
   * 关闭后下单即刻按当日净值成交。
   * 【警告】关闭会低估滑点风险，因为现实中你无法用"看到的净值"成交。
   */
  enableConfirmDelay: boolean
  /**
   * 分红处理方式。这是投资者的选择，而非基金属性。
   * reinvest：红利自动转份额；cash：红利转入现金账户。
   */
  dividendMethod: DividendMethod
  /**
   * 推进步长（自然日）。默认 1，即每次推进一天。
   * 周末与节假日照常经历（时间与真实世界一致），只是当天无净值更新。
   */
  stepDays: number
}

/**
 * 组的账户状态快照。
 *
 * 【推导产物】不持久化。由 orders + cashFlows 在指定日期重放计算得出。
 * 之所以不存字段，是因为造物主回拨后状态必须能重新推导，
 * 存字段必然导致状态与历史不一致。
 */
export interface GroupSnapshot {
  /** 该快照对应的日期 */
  date: TradingDate
  /** 现金账户三态 */
  cash: CashAccount
  /** 各基金持仓，以基金代码为键 */
  positions: Record<FundCode, Position>
  /** 持仓总市值 */
  totalMarketValue: Money
  /** 总资产 = cash.total + totalMarketValue */
  totalAsset: Money
  /** 累计净投入 = 初始资金 + 累计注资 - 累计提取 */
  netInvested: Money
  /** 浮动盈亏（所有持仓的未实现盈亏之和） */
  unrealizedProfit: Money
  /** 已实现盈亏（历史赎回累计，已扣费） */
  realizedProfit: Money
  /** 总盈亏 = unrealizedProfit + realizedProfit */
  totalProfit: Money
  /** 总收益率 = totalProfit / netInvested */
  totalProfitRate: number
  /** 累计已支付费用（申购费 + 赎回费） */
  totalFee: Money
  /** 仓位比例 = totalMarketValue / totalAsset */
  positionRatio: number
}

/**
 * 每日快照缓存条目。
 *
 * 【空间换时间】按用户建议，以天为单位缓存推导结果。
 * 时光回溯到任意历史日期时可直接读取，无需从头重放。
 *
 * 【失效规则】造物主回拨或任何历史订单变更时，
 * 必须清除该日期之后的所有缓存，否则会读到脏数据。
 */
export interface SnapshotCacheEntry {
  snapshot: GroupSnapshot
  /**
   * 该缓存基于的订单数量。
   * 用作简易校验：若当前订单数与之不符，说明历史已变更，缓存失效。
   */
  basedOnOrderCount: number
  computedAt: Timestamp
}

/**
 * 策略在某组中的绑定实例。
 * 同一策略可在不同组中以不同参数运行，参数与状态需按组隔离。
 */
export interface StrategyBinding {
  id: UUID
  strategyId: StrategyId
  /** 用户为该实例起的名字，便于同策略多参数对比 */
  alias: Nullable<string>
  /** 策略参数。结构由具体策略的 paramSchema 定义 */
  params: Record<string, unknown>
  /** 是否启用。禁用后推进时不再请求其建议 */
  enabled: boolean
  /**
   * 策略的持久化状态槽。
   * 供有状态策略（如马丁记录当前层数）跨日保存数据。
   *
   * 【关键约束】该状态必须能随时间回溯而还原。
   * 因此实现上不应直接可变，而应按日期存快照，或由策略提供纯函数从历史重算。
   */
  state: Record<string, unknown>
  createdAt: Timestamp
}

/**
 * 自选组 —— 一个独立的平行世界。
 *
 * 【持久化边界】只有本接口中的字段需要存储。
 * positions / snapshot 等状态均为推导产物，不入库。
 */
export interface BacktestGroup {
  id: GroupId
  /** 组名称 */
  name: string
  /** 组描述，用于记录这个平行世界的实验意图 */
  description: Nullable<string>

  /** 双时间轴 */
  timeline: GroupTimeline

  /** 推演配置 */
  config: GroupConfig

  /**
   * 关注的基金代码列表。
   * 【注意】只存引用，不存基金数据本身。行情数据在全局 FundRepository 中。
   */
  watchList: FundCode[]

  /**
   * 交易订单流水。唯一真相源，按 submittedAt 升序。
   * 【不变式】所有订单的 submittedDate 必须 <= timeline.frontier。
   */
  orders: Order[]

  /**
   * 资金流水。记录订单无法推导的现金变动（注资、提取）。
   */
  cashFlows: CashFlow[]

  /** 绑定的策略实例 */
  strategies: StrategyBinding[]

  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================
// 时间操作
// ============================================================

/** 时间推进的结果 */
export interface AdvanceTimeResult {
  success: boolean
  /** 推进前的 frontier */
  previousFrontier: TradingDate
  /** 推进后的 frontier */
  currentFrontier: TradingDate
  /** 本次推进跨越的日期列表 */
  passedDates: TradingDate[]
  /** 推进过程中被确认的订单 */
  confirmedOrders: Order[]
  /** 推进过程中到账的赎回订单 */
  settledOrders: Order[]
  /** 期间发生的分红事件 */
  dividendEvents: Array<{ fundCode: FundCode; date: TradingDate; amount: Money }>
  /** 失败原因 */
  error: Nullable<string>
}

/**
 * 造物主回拨记录。
 *
 * 【说明】按需求确认，回拨采用物理删除，被删订单不可恢复。
 * 但仍保留本记录用于审计——至少能知道"这个世界被人为干预过"。
 * 若后续想支持撤销，只需在此结构中增加 discardedOrders 字段即可，无需改动其他类型。
 */
export interface TimelineRollbackRecord {
  id: UUID
  /** 回拨前的 frontier */
  fromFrontier: TradingDate
  /** 回拨后的 frontier */
  toFrontier: TradingDate
  /** 被物理删除的订单数量 */
  discardedOrderCount: number
  /** 被物理删除的资金流水数量 */
  discardedCashFlowCount: number
  /** 执行时刻（现实世界时间） */
  executedAt: Timestamp
  /** 操作原因备注 */
  reason: Nullable<string>
}

/**
 * 组的运行时视图。这是 UI 层实际消费的数据结构。
 *
 * 【组装方式】由 BacktestGroup（持久化数据）+ FundRepository（全局行情）
 * 在 viewpoint 时刻计算得出。viewpoint 变化时整体重算（或读缓存）。
 */
export interface GroupRuntimeView {
  group: BacktestGroup
  /** 当前时间模式 */
  timeMode: TimeMode
  /** viewpoint 当日的账户快照 */
  snapshot: GroupSnapshot
  /**
   * 在 viewpoint 可见的订单（submittedDate <= viewpoint）。
   * 【重要】不能直接暴露 group.orders，否则处于过去时会看到"未来的交易"。
   */
  visibleOrders: Order[]
  /** 当前是否允许交易。等价于 timeMode === 'present' */
  tradable: boolean
  /** 若不可交易，说明原因（供 UI 提示） */
  untradableReason: Nullable<string>
}
