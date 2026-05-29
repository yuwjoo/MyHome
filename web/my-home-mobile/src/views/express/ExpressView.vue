<template>
  <div
    data-cmp="ExpressView"
    ref="containerRef"
    class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32"
    :class="scrollDisabled ? 'overflow-y-hidden' : 'overflow-y-auto'"
    :style="pullStyle"
    @touchstart.passive="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <PullRefreshIndicator :pulling="pulling" :refreshing="refreshing" :pull-distance="pullDistance" :threshold="threshold" />

    <!-- ── Header ── -->
    <header class="px-5 pt-10 pb-4">
      <div class="flex items-center justify-between mb-1">
        <div>
          <div class="text-xs text-muted-foreground font-medium">快递管理</div>
          <div class="text-xl font-bold text-foreground">我的快递</div>
        </div>
        <button
          class="relative w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-custom"
          @click="openFilter"
        >
          <SlidersHorizontalIcon :size="18" class="text-primary-foreground" :stroke-width="2" />
          <span
            v-if="activeFilterCount > 0"
            class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center"
          >{{ activeFilterCount }}</span>
        </button>
      </div>
    </header>

    <!-- ── Summary Card ── -->
    <div class="px-5 mb-5">
      <ExpressSummaryCard :list="EXPRESS_LIST" />
    </div>

    <!-- ── Tab ── -->
    <div class="px-5 mb-3">
      <div class="flex gap-2 bg-card border border-border rounded-2xl p-1.5 shadow-custom">
        <button
          v-for="[key, label] in [['pending', '待取件'], ['all', '全部快递']] as const"
          :key="key"
          class="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          :class="tab === key ? 'bg-primary text-primary-foreground shadow-custom' : 'text-muted-foreground'"
          @click="tab = key"
        >{{ label }}</button>
      </div>
    </div>

    <!-- ── Express List ── -->
    <div class="px-5 flex flex-col gap-3">
      <EmptyState v-if="displayed.length === 0" :icon="PackageIcon" title="暂无符合条件的快递" />
      <ExpressCard v-else v-for="item in displayed" :key="item.id" :item="item" />
    </div>

    <!-- ── 历史记录提示 ── -->
    <div class="px-5 mt-4 mb-2">
      <div class="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-2xl px-4 py-3">
        <CheckCircleIcon :size="14" :stroke-width="2" class="text-emerald-500 flex-shrink-0" />
        <span>近 7 天已签收 5 件，<span class="text-primary font-medium">查看历史</span></span>
        <ChevronRightIcon :size="12" :stroke-width="2.5" class="ml-auto" />
      </div>
    </div>

    <!-- ── 筛选抽屉 ── -->
    <ExpressFilterSheet
      :visible="filterOpen"
      :temp-time="tempTime"
      :temp-company="tempCompany"
      :temp-status="tempStatus"
      :temp-keyword="tempKeyword"
      @update:temp-time="tempTime = $event"
      @update:temp-company="tempCompany = $event"
      @update:temp-status="tempStatus = $event"
      @update:temp-keyword="tempKeyword = $event"
      @apply="applyFilter"
      @reset="resetFilter"
      @close="filterOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ExpressView.vue —— 快递管理页
 * 职责：组合子组件，页面级下拉刷新与筛选逻辑委托给 composable
 */
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { SlidersHorizontalIcon, PackageIcon, CheckCircleIcon, ChevronRightIcon } from 'lucide-vue-next'
import type { ExpressItem } from '@/types'
import { usePullRefresh } from '@/composables/usePullRefresh'
import { useExpressFilter } from './composables/useExpressFilter'
import ExpressSummaryCard  from './components/ExpressSummaryCard.vue'
import ExpressCard         from './components/ExpressCard.vue'
import ExpressFilterSheet  from './components/ExpressFilterSheet.vue'
import PullRefreshIndicator from '@/components/PullRefreshIndicator.vue'
import EmptyState          from '@/components/ui/EmptyState.vue'

// ── 演示数据（实际项目由 API 替换） ──
const EXPRESS_LIST: ExpressItem[] = [
  { id: 'e1', company: '顺丰速运', trackingNo: 'SF3112456789012', pickupCode: '7823', deadline: '今天 18:00前取件', status: 'arrived',  address: '智慧园区菜鸟驿站 1号柜', name: '小米充电宝 (×1)' },
  { id: 'e2', company: '京东物流', trackingNo: 'JD00243816312',   pickupCode: '4561', deadline: '明天 12:00前取件', status: 'arrived',  address: '智慧园区菜鸟驿站 3号柜', name: '《深度学习》书籍 (×2)' },
  { id: 'e3', company: '中通快递', trackingNo: 'ZT7809341527',    pickupCode: '',     deadline: '预计明天下午到',   status: 'arriving', address: '—',                     name: '运动鞋 (×1)' },
  { id: 'e4', company: '圆通速递', trackingNo: 'YT2987654321',    pickupCode: '',     deadline: '预计后天上午到',   status: 'pending',  address: '—',                     name: '键盘 (×1)' },
]

// ── 筛选逻辑 ──
const {
  tab,
  filterOpen,
  tempTime, tempCompany, tempStatus, tempKeyword,
  activeFilterCount,
  displayed,
  openFilter, applyFilter, resetFilter,
} = useExpressFilter(EXPRESS_LIST)

// ── 下拉刷新 ──
const refreshDisabled = computed(() => filterOpen.value)

const {
  containerRef,
  pulling,
  refreshing,
  pullDistance,
  threshold,
  scrollDisabled,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} = usePullRefresh(
  async () => {
    await new Promise((r) => setTimeout(r, 1200))
    toast.success('快递信息已刷新')
  },
  72,
  refreshDisabled,
)

const pullStyle = computed(() => ({
  transform: pulling.value || refreshing.value
    ? `translateY(${Math.min(pullDistance.value, threshold * 1.2)}px)`
    : undefined,
  transition: pulling.value ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.1,0.64,1)',
}))
</script>
