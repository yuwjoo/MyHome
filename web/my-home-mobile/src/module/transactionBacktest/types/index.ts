/**
 * 交易回测模块 - 类型统一出口
 *
 * 模块分层：
 *   common   基础语义类型（时间、金额、标识）
 *   fund     基金数据（全局共享的客观事实）
 *   trade    交易订单与持仓（组内的决策轨迹）
 *   group    自选组／平行世界（双时间轴 + 状态推导）
 *   strategy 交易策略（统一决策契约）
 *
 * 依赖方向：strategy -> group -> trade -> fund -> common，不存在反向依赖。
 */

export * from './common'
export * from './fund'
export * from './trade'
export * from './group'
export * from './strategy'
