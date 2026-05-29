<template>
  <div data-cmp="DevicesView" class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32">
    <!-- ── Header ── -->
    <PageHeader title="设备控制" :backable="true" @back="router.back()">
      <template #extra>
        <div class="text-xs text-muted-foreground mt-0.5">
          {{ onCount }} 台运行中 · 共 {{ devices.length }} 台
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="relative mt-4">
        <SearchIcon
          :size="15"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          :stroke-width="2"
        />
        <input
          v-model="search"
          placeholder="搜索设备名称 / 房间 / 类型"
          class="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </PageHeader>

    <!-- ── 状态横幅 ── -->
    <div class="px-5 mb-4">
      <DeviceStatusBanner
        :on-count="onCount"
        :total-count="devices.length"
        :all-on="allOn"
        @toggle-all="toggleAll"
      />
    </div>

    <!-- ── 房间标签 ── -->
    <div class="px-5 mb-4">
      <RoomTabs :rooms="rooms" :active-room="activeRoom" @select="activeRoom = $event" />
    </div>

    <!-- ── 设备网格 ── -->
    <div class="px-5">
      <EmptyState
        v-if="filtered.length === 0"
        :icon="SearchIcon"
        title="未找到匹配设备"
        description="试试换个关键词或房间"
      />
      <div v-else class="grid grid-cols-2 gap-3">
        <DeviceCard
          v-for="device in filtered"
          :key="device.id"
          :device="device"
          :show-room="true"
          :show-label="true"
          @toggle="toggleDevice"
          @click="handleCardClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DevicesView.vue —— 全部设备控制页
 * 职责：组合子组件，业务逻辑委托给 useDeviceList
 */
import { SearchIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useDeviceList } from './composables/useDeviceList'
import DeviceStatusBanner from './components/DeviceStatusBanner.vue'
import RoomTabs           from './components/RoomTabs.vue'
import DeviceCard         from '@/components/ui/DeviceCard.vue'
import EmptyState         from '@/components/ui/EmptyState.vue'
import PageHeader         from '@/components/ui/PageHeader.vue'
import type { SmartDevice } from '@/types'

const router = useRouter()
const {
  devices, activeRoom, search, rooms,
  onCount, allOn, filtered,
  toggleDevice, toggleAll,
} = useDeviceList()

function handleCardClick(device: SmartDevice) {
  if (device.type === 'ac') router.push('/ac-remote')
}
</script>
