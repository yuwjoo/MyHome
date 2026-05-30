/**
 * src/views/express/composables/useExpressFilter.ts
 * 快递列表筛选逻辑
 */
import { ref, computed } from 'vue'
import type { ExpressItem, ExpressStatus } from '@/types'
import {
  EXPRESS_TIME_OPTIONS,
  EXPRESS_COMPANY_OPTIONS,
} from '@/constants'

/** 默认筛选状态 */
const DEFAULT_FILTER: {
  time: string
  company: string
  status: ExpressStatus | 'all'
  keyword: string
} = {
  time:    EXPRESS_TIME_OPTIONS[0],
  company: EXPRESS_COMPANY_OPTIONS[0],
  status:  'all',
  keyword: '',
}

export function useExpressFilter(list: ExpressItem[]) {
  // ── 已应用的筛选 ──
  const filterTime    = ref(DEFAULT_FILTER.time)
  const filterCompany = ref(DEFAULT_FILTER.company)
  const filterStatus  = ref<ExpressStatus | 'all'>(DEFAULT_FILTER.status)
  const filterKeyword = ref(DEFAULT_FILTER.keyword)

  // ── 草稿筛选（底部抽屉中编辑，点应用后同步） ──
  const tempTime    = ref(DEFAULT_FILTER.time)
  const tempCompany = ref(DEFAULT_FILTER.company)
  const tempStatus  = ref<ExpressStatus | 'all'>(DEFAULT_FILTER.status)
  const tempKeyword = ref(DEFAULT_FILTER.keyword)

  const filterOpen = ref(false)

  /** 打开筛选面板，并将当前值同步到草稿 */
  function openFilter() {
    tempTime.value    = filterTime.value
    tempCompany.value = filterCompany.value
    tempStatus.value  = filterStatus.value
    tempKeyword.value = filterKeyword.value
    filterOpen.value  = true
  }

  /** 应用草稿筛选 */
  function applyFilter() {
    filterTime.value    = tempTime.value
    filterCompany.value = tempCompany.value
    filterStatus.value  = tempStatus.value
    filterKeyword.value = tempKeyword.value
    filterOpen.value    = false
  }

  /** 重置草稿筛选 */
  function resetFilter() {
    tempTime.value    = DEFAULT_FILTER.time
    tempCompany.value = DEFAULT_FILTER.company
    tempStatus.value  = DEFAULT_FILTER.status
    tempKeyword.value = DEFAULT_FILTER.keyword
  }

  /** 已激活的筛选条件数量（用于显示徽标） */
  const activeFilterCount = computed(() =>
    [
      filterTime.value    !== DEFAULT_FILTER.time,
      filterCompany.value !== DEFAULT_FILTER.company,
      filterStatus.value  !== DEFAULT_FILTER.status,
      filterKeyword.value.trim() !== '',
    ].filter(Boolean).length,
  )

  /** 当前 tab：pending = 待取件，all = 全部 */
  const tab = ref<'pending' | 'all'>('pending')

  /** 经过筛选的快递列表 */
  const displayed = computed(() =>
    list.filter((e) => {
      if (tab.value === 'pending' && e.status === 'arrived') return false
      if (filterCompany.value !== DEFAULT_FILTER.company && e.company !== filterCompany.value) return false
      if (filterStatus.value  !== 'all' && e.status !== filterStatus.value) return false
      if (
        filterKeyword.value.trim() &&
        !e.company.includes(filterKeyword.value) &&
        !e.trackingNo.includes(filterKeyword.value) &&
        !e.name.includes(filterKeyword.value)
      ) return false
      return true
    }),
  )

  return {
    tab,
    filterOpen,
    filterTime, filterCompany, filterStatus, filterKeyword,
    tempTime, tempCompany, tempStatus, tempKeyword,
    activeFilterCount,
    displayed,
    openFilter, applyFilter, resetFilter,
  }
}
