// ── 快递相关类型 ───────────────────────────────────────────────────────────────

/** 快递状态 */
export type ExpressStatus = 'pending' | 'arriving' | 'arrived'

/** 快递项 */
export interface ExpressItem {
  id: string
  company: string
  trackingNo: string
  pickupCode: string
  deadline: string
  status: ExpressStatus
  address: string
  name: string
}
