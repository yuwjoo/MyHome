<script setup lang="ts">
/**
 * ExpressCard.vue —— 单条快递卡片
 */
import { PackageIcon, CopyIcon, TruckIcon, MapPinIcon, ClockIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ExpressItem } from '@/types'
import { EXPRESS_STATUS_MAP, EXPRESS_COMPANY_COLORS } from '@/constants'

defineProps<{
  item: ExpressItem
}>()

function copyCode(item: ExpressItem) {
  toast.success(`取件码 ${item.pickupCode} 已复制`)
}

function getCompanyInitial(name: string) {
  return name.slice(0, 1)
}
</script>

<template>
  <div class="bg-card rounded-2xl p-4 shadow-custom border border-border">
    <!-- 公司 & 状态 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
          :class="EXPRESS_COMPANY_COLORS[item.company] ?? 'bg-primary/10 text-primary'"
        >
          {{ getCompanyInitial(item.company) }}
        </div>
        <div>
          <div class="text-sm font-bold text-foreground">{{ item.company }}</div>
          <div class="text-[10px] text-muted-foreground">{{ item.trackingNo }}</div>
        </div>
      </div>
      <div
        class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
        :class="EXPRESS_STATUS_MAP[item.status].style"
      >
        <div class="w-1.5 h-1.5 rounded-full" :class="EXPRESS_STATUS_MAP[item.status].dot" />
        {{ EXPRESS_STATUS_MAP[item.status].text }}
      </div>
    </div>

    <!-- 商品名 -->
    <div class="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
      <PackageIcon :size="11" :stroke-width="2" />
      {{ item.name }}
    </div>

    <!-- 取件码 / 派送状态 -->
    <div
      class="rounded-xl p-3 mb-3"
      :class="item.status === 'arrived' ? 'bg-primary/8 border border-primary/20' : 'bg-muted'"
    >
      <div v-if="item.status === 'arrived'" class="flex items-center justify-between">
        <div>
          <div class="text-[10px] text-muted-foreground mb-0.5">取件码</div>
          <div class="flex items-center gap-2">
            <span
              v-for="(ch, i) in item.pickupCode.split('')"
              :key="i"
              class="w-8 h-8 bg-card rounded-xl flex items-center justify-center text-lg font-bold text-primary shadow-custom border border-border"
            >{{ ch }}</span>
          </div>
        </div>
        <button
          class="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold shadow-custom"
          @click="copyCode(item)"
        >
          <CopyIcon :size="12" :stroke-width="2.5" />
          复制
        </button>
      </div>
      <div v-else class="flex items-center gap-2">
        <TruckIcon :size="14" class="text-muted-foreground" :stroke-width="2" />
        <span class="text-xs text-muted-foreground">取件码将在到达后显示</span>
      </div>
    </div>

    <!-- 地址 & 时限 -->
    <div class="flex items-center justify-between text-[10px] text-muted-foreground">
      <div class="flex items-center gap-1">
        <MapPinIcon :size="10" :stroke-width="2" />
        <span>{{ item.address }}</span>
      </div>
      <div class="flex items-center gap-1">
        <ClockIcon :size="10" :stroke-width="2" />
        <span>{{ item.deadline }}</span>
      </div>
    </div>
  </div>
</template>
