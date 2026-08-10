/**
 * 交易回测模块 - 基础类型
 *
 * 设计要点：
 * 1. 时间分两套：`TradingDate`（日历日，行情/推演的刻度）与 `Timestamp`（精确时刻，事件发生点）。
 *    基金净值天然是"每日一个"，但下单时刻需精确到秒（15:00 前后决定确认日），二者不可混为一谈。
 * 2. 金额一律用"分/厘"级整数吗？—— 否。基金份额与净值存在 4 位小数，
 *    统一用 number 但通过 `Money` / `Shares` 语义别名标注，计算层强制走 decimal 工具，避免浮点误差。
 */

/** 日历日期，格式严格为 `YYYY-MM-DD`。这是行情与推演的基本刻度 */
export type TradingDate = string

/** Unix 毫秒时间戳。用于记录事件发生的精确时刻（如下单时间，判断是否早于 15:00） */
export type Timestamp = number

/**
 * 金额，单位「元」。
 * 注意：JS number 存在浮点误差，所有加减乘除必须走 decimal 工具函数，禁止直接运算。
 */
export type Money = number

/** 基金份额，通常保留 2 位小数 */
export type Shares = number

/** 基金净值，通常保留 4 位小数 */
export type NetValue = number

/** 比率，用小数表示。0.015 表示 1.5%，而非 1.5 */
export type Rate = number

/** 基金代码，6 位数字字符串。作为基金的全局唯一标识 */
export type FundCode = string

/** 通用唯一标识 */
export type UUID = string

/** 自选组标识 */
export type GroupId = UUID

/** 策略标识 */
export type StrategyId = string

/** 订单标识 */
export type OrderId = UUID

/** 持仓批次标识 */
export type LotId = UUID

/**
 * 交易日切分时刻。
 * 事实依据：中国公募基金以 T 日 15:00 为申赎申请的分界点，
 * 15:00 前提交按 T 日净值确认，15:00 后按 T+1 日净值确认。
 * 该值可被单只基金的 `TradingRule.cutOffTime` 覆盖（少数基金为 14:00）。
 */
export const DEFAULT_CUT_OFF_TIME = '15:00:00'

/** 一天中的时刻，格式 `HH:mm:ss` */
export type TimeOfDay = string

/** 可为空的值，语义上表示"数据源未提供"，区别于"值为 0" */
export type Nullable<T> = T | null

/**
 * 带数据来源标注的值。
 * 现实约束：基金数据来自不同渠道（天天基金、蛋卷、官方公告），完备度不一。
 * 显式标注来源与更新时间，避免出现"不知道这个数字准不准"的情况。
 */
export interface Sourced<T> {
  value: T
  /** 数据来源标识，如 'eastmoney' | 'manual' | 'derived' */
  source: string
  /** 该数据的采集/计算时间 */
  fetchedAt: Timestamp
}

/** 排序方向 */
export type SortOrder = 'asc' | 'desc'

/** 分页查询入参 */
export interface Pagination {
  page: number
  pageSize: number
}

/** 日期闭区间 */
export interface DateRange {
  /** 起始日，含 */
  start: TradingDate
  /** 结束日，含 */
  end: TradingDate
}
