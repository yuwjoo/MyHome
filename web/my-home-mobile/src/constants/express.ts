/**
 * src/constants/express.ts
 * 快递相关静态常量（状态标签、公司颜色等）
 */
import type { ExpressStatus } from '@/types'

/** 快递状态 → 显示文字 + 样式 */
export const EXPRESS_STATUS_MAP: Record<ExpressStatus, { text: string; style: string; dot: string }> = {
  arrived: { text: '已到达', style: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
  arriving: { text: '派送中', style: 'bg-amber-100 text-amber-600',   dot: 'bg-amber-500'  },
  pending:  { text: '待揽收', style: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
}

/** 快递公司 → 颜色类名 */
export const EXPRESS_COMPANY_COLORS: Record<string, string> = {
  顺丰速运: 'bg-red-100 text-red-500',
  京东物流: 'bg-rose-100 text-rose-600',
  中通快递: 'bg-amber-100 text-amber-600',
  圆通速递: 'bg-yellow-100 text-yellow-600',
}

/** 时间筛选选项 */
export const EXPRESS_TIME_OPTIONS = ['全部时间', '今天', '近3天', '近7天', '近30天'] as const

/** 公司筛选选项 */
export const EXPRESS_COMPANY_OPTIONS = ['全部公司', '顺丰速运', '京东物流', '中通快递', '圆通速递'] as const

/** 状态筛选选项 */
export const EXPRESS_STATUS_OPTIONS: { label: string; value: ExpressStatus | 'all' }[] = [
  { label: '全部状态', value: 'all'      },
  { label: '已到达',  value: 'arrived'  },
  { label: '派送中',  value: 'arriving' },
  { label: '待揽收',  value: 'pending'  },
]
