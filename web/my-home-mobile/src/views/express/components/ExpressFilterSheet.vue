<script setup lang="ts">
/**
 * ExpressFilterSheet.vue —— 快递筛选底部抽屉
 */
import { XIcon, SearchIcon } from 'lucide-vue-next'
import type { ExpressStatus } from '@/types'
import {
  EXPRESS_TIME_OPTIONS,
  EXPRESS_COMPANY_OPTIONS,
  EXPRESS_STATUS_OPTIONS,
} from '@/constants'
import BottomSheet from '@/components/ui/BottomSheet.vue'

defineProps<{
  visible: boolean
  tempTime: string
  tempCompany: string
  tempStatus: ExpressStatus | 'all'
  tempKeyword: string
}>()

const emit = defineEmits<{
  (e: 'update:tempTime',    val: string): void
  (e: 'update:tempCompany', val: string): void
  (e: 'update:tempStatus',  val: ExpressStatus | 'all'): void
  (e: 'update:tempKeyword', val: string): void
  (e: 'apply'): void
  (e: 'reset'): void
  (e: 'close'): void
}>()
</script>

<template>
  <BottomSheet :visible="visible" @close="emit('close')">
    <div class="flex items-center justify-between mb-4">
      <span class="text-base font-bold text-foreground">筛选快递</span>
      <button
        class="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
        @click="emit('close')"
      >
        <XIcon :size="16" :stroke-width="2" class="text-muted-foreground" />
      </button>
    </div>

    <!-- 模糊搜索 -->
    <div class="mb-4">
      <div class="text-xs font-semibold text-muted-foreground mb-2">模糊搜索</div>
      <div class="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2.5 border border-border">
        <SearchIcon :size="14" :stroke-width="2" class="text-muted-foreground flex-shrink-0" />
        <input
          :value="tempKeyword"
          type="text"
          placeholder="公司名、单号、商品名..."
          class="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          @input="emit('update:tempKeyword', ($event.target as HTMLInputElement).value)"
        />
        <button v-if="tempKeyword" @click="emit('update:tempKeyword', '')">
          <XIcon :size="13" :stroke-width="2" class="text-muted-foreground" />
        </button>
      </div>
    </div>

    <!-- 时间范围 -->
    <div class="mb-4">
      <div class="text-xs font-semibold text-muted-foreground mb-2">时间范围</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in EXPRESS_TIME_OPTIONS"
          :key="opt"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          :class="tempTime === opt ? 'bg-primary text-primary-foreground shadow-custom' : 'bg-muted text-muted-foreground'"
          @click="emit('update:tempTime', opt)"
        >{{ opt }}</button>
      </div>
    </div>

    <!-- 快递公司 -->
    <div class="mb-4">
      <div class="text-xs font-semibold text-muted-foreground mb-2">快递公司</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in EXPRESS_COMPANY_OPTIONS"
          :key="opt"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          :class="tempCompany === opt ? 'bg-primary text-primary-foreground shadow-custom' : 'bg-muted text-muted-foreground'"
          @click="emit('update:tempCompany', opt)"
        >{{ opt }}</button>
      </div>
    </div>

    <!-- 快递状态 -->
    <div class="mb-5">
      <div class="text-xs font-semibold text-muted-foreground mb-2">快递状态</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in EXPRESS_STATUS_OPTIONS"
          :key="opt.value"
          class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          :class="tempStatus === opt.value ? 'bg-primary text-primary-foreground shadow-custom' : 'bg-muted text-muted-foreground'"
          @click="emit('update:tempStatus', opt.value)"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-3">
      <button
        class="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground text-sm font-semibold"
        @click="emit('reset')"
      >重置</button>
      <button
        class="flex-[2] py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-custom"
        @click="emit('apply')"
      >应用筛选</button>
    </div>
  </BottomSheet>
</template>
