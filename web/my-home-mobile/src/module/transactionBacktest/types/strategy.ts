/**
 * 交易回测模块 - 交易策略类型
 *
 * 【策略的本质】给定当前情况，判断该「买 / 卖 / 观望」。
 * 策略是一份接口契约，不是可执行脚本文本。用户通过实现接口来提供具体逻辑。
 *
 * 【防未来函数】这是回测系统最致命的 bug 来源。
 * 本设计在类型层面切断未来数据：策略拿到的是 `MarketWindow` 而非完整 NavSeries，
 * 窗口物理上只包含 viewpoint 及之前的数据。策略即使想作弊也拿不到未来行情。
 *
 * 【纯函数原则】策略只返回决策建议，不直接修改任何状态。
 * 余额校验、费用计算、订单生成全部由引擎负责。
 * 理由：否则策略可以买入超过现金的量，且无法单元测试。
 */

import type {
  FundCode,
  LotId,
  Money,
  NetValue,
  Nullable,
  Rate,
  Shares,
  StrategyId,
  TradingDate,
} from './common'
import type { FundProfile, FundTradingRule, NavPoint } from './fund'
import type { CashAccount, Order, Position, PositionLot } from './trade'

// ============================================================
// 决策信号
// ============================================================

/** 决策动作 */
export type SignalAction =
  | 'buy' // 建议买入
  | 'sell' // 建议卖出
  | 'hold' // 建议观望（不操作）

/**
 * 买入数量的表达方式。
 * 提供多种口径是因为不同策略的思维方式不同：
 * 定投思考「每期投多少钱」，仓位管理思考「加到几成仓」。
 */
export type BuySizing =
  | { type: 'amount'; value: Money } // 固定金额
  | { type: 'cashRatio'; value: Rate } // 占可用现金的比例
  | { type: 'assetRatio'; value: Rate } // 占总资产的比例
  | { type: 'targetPosition'; value: Rate } // 加仓至目标仓位比例

/** 卖出数量的表达方式 */
export type SellSizing =
  | { type: 'shares'; value: Shares } // 固定份额
  | { type: 'sharesRatio'; value: Rate } // 占当前持仓份额的比例
  | { type: 'amount'; value: Money } // 按目标金额折算份额
  | { type: 'all' } // 全部清仓
  | { type: 'lots'; lotIds: LotId[] } // 指定批次清空

/**
 * 策略输出的单条决策信号。
 *
 * 【注意】这只是建议。按需求确认，采用人在环中模式，
 * 最终是否下单由用户确认。引擎会先做可行性校验并把结果回填到 feasibility。
 */
export interface StrategySignal {
  /** 目标基金 */
  fundCode: FundCode
  /** 建议动作 */
  action: SignalAction
  /** 买入数量。action='buy' 时必填 */
  buySizing: Nullable<BuySizing>
  /** 卖出数量。action='sell' 时必填 */
  sellSizing: Nullable<SellSizing>
  /**
   * 信号强度，0~1。
   * 用于同时产生多个信号时的排序与展示，不参与金额计算。
   */
  confidence: Nullable<number>
  /**
   * 决策理由。面向用户的可读说明，如「已连续下跌 3 天，触发马丁第 2 层加仓」。
   * 【重要】强烈建议策略填写，否则用户无法判断是否该采纳这条建议。
   */
  reason: string
  /**
   * 结构化的决策依据。用于 UI 高亮展示关键指标。
   * 如 { drawdown: -0.08, martingaleLevel: 2 }
   */
  metrics: Nullable<Record<string, number | string>>
}

/** 引擎对信号的可行性校验结果 */
export interface SignalFeasibility {
  /** 是否可执行 */
  executable: boolean
  /** 折算后的实际申购金额 */
  resolvedAmount: Nullable<Money>
  /** 折算后的实际赎回份额 */
  resolvedShares: Nullable<Shares>
  /** 预估费用 */
  estimatedFee: Nullable<Money>
  /** 预估确认日期 */
  estimatedConfirmDate: Nullable<TradingDate>
  /** 不可执行的原因 */
  blockReason: Nullable<string>
  /** 提示信息，如「持有不足 7 天，将收取 1.5% 惩罚性赎回费」 */
  warnings: string[]
}

/** 附带校验结果的信号，这是 UI 最终展示给用户的形态 */
export interface EvaluatedSignal {
  signal: StrategySignal
  feasibility: SignalFeasibility
}

// ============================================================
// 策略上下文（防未来函数的关键）
// ============================================================

/**
 * 行情窗口。策略访问净值数据的**唯一**入口。
 *
 * 【安全保证】构造该对象时，引擎已把 viewpoint 之后的数据全部裁剪。
 * 策略无论怎么调用都不可能读到未来行情。
 *
 * 【性能】技术指标全部设计为方法而非预计算字段，
 * 采用惰性求值 + 内部记忆化。若全部预计算，每日推进都要算一遍全部指标，
 * 在多基金场景下会明显拖慢。
 */
export interface MarketWindow {
  fundCode: FundCode
  /** 当前观察日 */
  currentDate: TradingDate
  /**
   * 当日净值点。
   * null 表示当日非交易日或数据缺失——策略必须处理此情况。
   */
  current: Nullable<NavPoint>
  /**
   * 最近一个有效交易日的净值点。
   * 当 current 为 null（周末/节假日）时，用它作为参考价。
   */
  latest: Nullable<NavPoint>

  /** 窗口内可用的历史数据总条数 */
  length: number

  /**
   * 取相对当前的第 n 个历史交易日净值。
   * n=0 为最近交易日，n=1 为前一交易日，以此类推。
   * 越界返回 null。
   */
  at(n: number): Nullable<NavPoint>

  /**
   * 取最近 n 个交易日的净值序列，按日期升序。
   * 不足 n 条时返回全部可用数据。
   */
  recent(n: number): NavPoint[]

  /**
   * 取指定日期的净值点。
   * 若目标日期晚于 currentDate，一律返回 null（防未来函数）。
   */
  atDate(date: TradingDate): Nullable<NavPoint>

  // ---------- 派生指标（惰性计算） ----------

  /** n 日简单移动均线（基于复权净值） */
  sma(n: number): Nullable<NetValue>
  /** n 日指数移动均线 */
  ema(n: number): Nullable<NetValue>
  /** n 日累计涨跌幅 */
  changeRate(n: number): Nullable<Rate>
  /** n 日年化波动率（收益率标准差） */
  volatility(n: number): Nullable<Rate>
  /** 从窗口内最高点算起的当前回撤幅度（负值） */
  drawdown(n: number): Nullable<Rate>
  /** 窗口内最高净值 */
  highest(n: number): Nullable<NetValue>
  /** 窗口内最低净值 */
  lowest(n: number): Nullable<NetValue>
  /**
   * 当前连续上涨/下跌的交易日数。
   * 正数表示连涨天数，负数表示连跌天数，0 表示当日持平。
   */
  consecutiveDays(): number
  /** n 日 RSI 相对强弱指标，取值 0~100 */
  rsi(n: number): Nullable<number>
}

/**
 * 单只基金在策略视角下的完整信息包。
 */
export interface FundContext {
  /** 基金静态档案 */
  profile: FundProfile
  /** 行情窗口（已裁剪未来数据） */
  market: MarketWindow
  /** 交易规则（含费用阶梯与确认/到账规则）。用于策略判断确认延迟、限购，并自行预估交易成本 */
  tradingRule: Nullable<FundTradingRule>
  /** 当前持仓。无持仓时为 null */
  position: Nullable<Position>
  /**
   * 持仓批次明细，按建仓日升序。
   * 马丁类策略依赖此数据判断当前处于第几层加仓。
   */
  lots: PositionLot[]
  /** 该基金的历史订单（仅 viewpoint 之前） */
  orders: Order[]
  /** 当日是否可交易（非交易日、暂停申赎时为 false） */
  tradable: boolean
}

/**
 * 账户层面的上下文。
 */
export interface AccountContext {
  /** 现金三态 */
  cash: CashAccount
  /** 总资产 */
  totalAsset: Money
  /** 持仓总市值 */
  totalMarketValue: Money
  /** 仓位比例 */
  positionRatio: Rate
  /** 累计净投入 */
  netInvested: Money
  /** 浮动盈亏 */
  unrealizedProfit: Money
  /** 已实现盈亏 */
  realizedProfit: Money
  /** 总收益率 */
  totalProfitRate: Rate
  /** 累计已付费用 */
  totalFee: Money
  /** 账户层面的最大回撤（自组创建以来） */
  maxDrawdown: Rate
}

/**
 * 策略自身的历史决策记录。
 * 支持「反马丁需要知道上次是盈是亏」这类依赖自身历史的策略。
 */
export interface StrategyDecisionRecord {
  date: TradingDate
  fundCode: FundCode
  action: SignalAction
  reason: string
  /** 用户是否采纳了该建议 */
  adopted: boolean
  /** 若采纳，对应生成的订单 */
  orderId: Nullable<string>
}

/**
 * 策略执行上下文。这是策略能看到的全部信息。
 *
 * 【边界】所有数据均已按 viewpoint 裁剪，不含任何未来信息。
 */
export interface StrategyContext<P = Record<string, unknown>, S = Record<string, unknown>> {
  /** 当前决策日期 */
  date: TradingDate
  /** 组内所有关注基金的上下文，以代码为键 */
  funds: Record<FundCode, FundContext>
  /** 关注列表（保持顺序） */
  watchList: FundCode[]
  /** 账户状态 */
  account: AccountContext
  /** 策略参数。由用户配置，类型由具体策略定义 */
  params: P
  /**
   * 策略持久化状态。跨日保留，供有状态策略使用（如马丁的当前层数）。
   *
   * 【重要约束】策略**不应**直接修改此对象。
   * 需要更新状态时，通过 StrategyResult.nextState 返回新状态，由引擎写入。
   * 理由：直接可变会导致时光回溯时状态无法还原。
   */
  state: Readonly<S>
  /** 该策略实例的历史决策记录 */
  history: StrategyDecisionRecord[]
  /**
   * 距组起始日已推演的自然日数。
   * 便于定投类策略判断周期（如"每 30 天投一次"）。
   */
  elapsedDays: number
}

// ============================================================
// 策略定义
// ============================================================

/** 参数字段类型 */
export type ParamFieldType = 'number' | 'boolean' | 'string' | 'enum' | 'percent'

/**
 * 策略参数的元描述。
 * 用于自动生成参数配置表单，避免每个策略都手写一套 UI。
 */
export interface ParamField {
  key: string
  /** 展示名称 */
  label: string
  type: ParamFieldType
  /** 默认值 */
  defaultValue: unknown
  /** 数值类型的取值范围 */
  min: Nullable<number>
  max: Nullable<number>
  /** 数值步长 */
  step: Nullable<number>
  /** enum 类型的候选项 */
  options: Nullable<Array<{ label: string; value: string | number }>>
  /** 参数说明，解释这个参数如何影响策略行为 */
  description: Nullable<string>
  /** 是否必填 */
  required: boolean
}

/**
 * 策略返回结果。
 */
export interface StrategyResult<S = Record<string, unknown>> {
  /**
   * 决策信号列表。
   * 空数组等价于全部观望。允许一次返回多只基金的信号（如调仓）。
   */
  signals: StrategySignal[]
  /**
   * 更新后的策略状态。返回 undefined 表示状态不变。
   * 引擎负责持久化，并保证时光回溯时能正确还原。
   */
  nextState: Nullable<S>
  /**
   * 策略本次运行的整体说明。
   * 与单条信号的 reason 互补，用于解释"为什么这次什么都不做"。
   */
  summary: Nullable<string>
}

/**
 * 策略定义 —— 用户需要实现的统一契约。
 *
 * 【纯函数要求】decide 必须是纯函数：
 *   - 不修改 context 中的任何内容
 *   - 不产生副作用（不发请求、不写存储）
 *   - 相同输入必须产生相同输出
 * 违反纯函数约定会导致时光回溯时结果不可复现。
 */
export interface StrategyDefinition<
  P = Record<string, unknown>,
  S = Record<string, unknown>,
> {
  /** 策略唯一标识 */
  id: StrategyId
  /** 策略名称 */
  name: string
  /** 策略说明。应清楚描述适用场景与风险 */
  description: string
  /** 版本号。策略逻辑变更时递增，便于识别历史回测结果基于哪个版本 */
  version: string
  /** 参数元描述，用于生成配置表单 */
  paramSchema: ParamField[]
  /** 状态初始值。首次运行时作为 context.state 传入 */
  initialState: S

  /**
   * 核心决策钩子。每次时间推进后调用，返回买/卖/观望建议。
   *
   * @param context 当前情况的完整快照，已裁剪未来数据
   * @returns 决策结果
   */
  decide(context: StrategyContext<P, S>): StrategyResult<S>

  /**
   * 可选：参数校验钩子。
   * 在用户保存参数配置时调用，返回错误信息数组，空数组表示校验通过。
   * 用于表达 paramSchema 无法描述的约束（如「止盈线必须大于止损线」）。
   */
  validateParams?(params: P): string[]

  /**
   * 可选：状态重算钩子。
   *
   * 【用途】时光回溯的关键。当 viewpoint 回到过去时，
   * 引擎需要还原策略在那一天的状态。
   * 若策略状态可由历史决策记录推导，实现此钩子即可；
   * 未实现时引擎会退化为从组起始日重放全部决策，性能较差。
   */
  deriveState?(history: StrategyDecisionRecord[], params: P): S
}

/**
 * 策略注册表。全局共享，与自选组无关。
 */
export interface StrategyRegistry {
  /** 已注册的策略，以 id 为键 */
  strategies: Record<StrategyId, StrategyDefinition>
  /** 已注册的策略 id 列表 */
  ids: StrategyId[]
}

/**
 * 策略运行的一次完整输出，供 UI 消费。
 */
export interface StrategyRunResult {
  strategyId: StrategyId
  /** 绑定实例 id */
  bindingId: string
  /** 运行日期 */
  date: TradingDate
  /** 已附带可行性校验的信号 */
  signals: EvaluatedSignal[]
  /** 整体说明 */
  summary: Nullable<string>
  /** 运行耗时（毫秒），用于识别性能异常的策略 */
  duration: number
  /** 策略抛出异常时的错误信息。有值时 signals 为空 */
  error: Nullable<string>
}
