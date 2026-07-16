<template>
  <div
    data-cmp="LanDevicesView"
    ref="containerRef"
    class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32"
    :class="scrollDisabled ? 'overflow-y-hidden' : 'overflow-y-auto'"
    :style="pullStyle"
    @touchstart.passive="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <PullRefreshIndicator :pulling="pulling" :refreshing="refreshing" :pull-distance="pullDistance" :threshold="threshold" />

    <!-- Header -->
    <PageHeader title="内网设备" :backable="true" @back="router.back()">
      <template #actions>
        <button
          class="w-9 h-9 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
          :class="loading ? 'opacity-50' : ''"
          :disabled="loading"
          @click="handleRefresh"
        >
          <RefreshCwIcon
            :size="16"
            class="text-foreground"
            :class="loading ? 'animate-spin' : ''"
            :stroke-width="2.5"
          />
        </button>
      </template>
      <template #extra>
        <div class="flex items-center gap-1.5 mt-1">
          <span
            class="inline-block w-1.5 h-1.5 rounded-full"
            :class="connected ? 'bg-emerald-400' : 'bg-red-400'"
          />
          <span class="text-xs" :class="connected ? 'text-emerald-500' : 'text-red-400'">
            {{ connected ? '组播已连接' : '组播未连接' }}
          </span>
          <span class="text-xs text-muted-foreground ml-1">
            · {{ onlineCount }} 台在线 / 共 {{ devices.length }} 台
          </span>
        </div>
      </template>
    </PageHeader>

    <!-- Device List -->
    <div class="px-5">
      <EmptyState
        v-if="!loading && devices.length === 0"
        :icon="RouterIcon"
        title="未发现内网设备"
        description="确保手机与设备在同一局域网下"
      />

      <div v-else class="flex flex-col gap-3">
        <TransitionGroup name="device-list">
          <div
            v-for="device in devices"
            :key="device.ipAddress"
            class="flex items-center gap-3 bg-card border rounded-2xl p-4 shadow-custom transition-all"
            :class="device.online ? 'border-emerald-500/20' : 'border-border opacity-60'"
          >
            <!-- Status dot -->
            <span
              class="flex-shrink-0 w-2.5 h-2.5 rounded-full"
              :class="device.online ? 'bg-emerald-400' : 'bg-gray-300'"
            />

            <!-- Device info -->
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-foreground truncate">
                {{ device.deviceName || '未命名设备' }}
              </div>
              <div class="text-xs text-muted-foreground mt-0.5">
                {{ device.ipAddress }}
              </div>
            </div>

            <!-- Abilities tags -->
            <div v-if="device.abilities.length > 0" class="flex flex-wrap gap-1 justify-end max-w-[50%]">
              <span
                v-for="ability in device.abilities"
                :key="ability"
                class="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium truncate max-w-[120px]"
              >
                {{ ability }}
              </span>
            </div>

            <!-- Offline badge -->
            <span
              v-if="!device.online"
              class="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-medium"
            >
              离线
            </span>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * LanDevicesView.vue —— 内网设备实时展示页
 * 职责：组合 useLanDevices，展示当前局域网内设备
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { RefreshCwIcon, RouterIcon } from 'lucide-vue-next'
import { usePullRefresh } from '@/composables/usePullRefresh'
import { useLanDevices } from './composables/useLanDevices'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PullRefreshIndicator from '@/components/PullRefreshIndicator.vue'

const router = useRouter()
const { devices, connected, loading, refresh } = useLanDevices()

const onlineCount = computed(() => devices.value.filter((d) => d.online).length)

// ── 下拉刷新 ──
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
    await refresh()
    toast.success('设备列表已刷新')
  },
  72,
)

const pullStyle = computed(() => ({
  transform: pulling.value || refreshing.value
    ? `translateY(${Math.min(pullDistance.value, threshold * 1.2)}px)`
    : undefined,
  transition: pulling.value ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.1,0.64,1)',
}))

/**
 * 手动点击刷新
 */
function handleRefresh() {
  refresh().then(() => {
    toast.success('设备列表已刷新')
  })
}
</script>
