<template>
  <div data-cmp="HomeView" class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32">
    <!-- ── Header ── -->
    <header class="px-5 pt-10 pb-4">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-3">
          <!-- 用户头像 -->
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            class="w-10 h-10 rounded-2xl object-cover"
            alt="avatar"
          />
          <div
            v-else
            class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <UserCircleIcon :size="24" class="text-primary" :stroke-width="1.5" />
          </div>
          <div>
            <div class="text-xs text-muted-foreground font-medium">欢迎回来 👋</div>
            <div class="text-xl font-bold text-foreground">珠江四季悦城</div>
          </div>
        </div>
        <button
          class="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
          @click="router.push('/messages')"
        >
          <BellIcon :size="18" class="text-foreground" :stroke-width="2" />
        </button>
      </div>
    </header>

    <!-- ── Overview Card ── -->
    <div class="px-5 mb-5">
      <OverviewCard :on-count="onDevicesCount" :total-count="devices.length" />
    </div>

    <!-- ── Scene Modes ── -->
    <div class="px-5 mb-5">
      <SceneGrid />
    </div>

    <!-- ── Device Cards ── -->
    <div class="px-5 mb-6">
      <HomeDeviceGrid
        :devices="devices"
        @toggle="toggleDevice"
        @view-all="router.push('/devices')"
        @card-click="handleCardClick"
      />
    </div>

    <!-- ── Shortcut Cards ── -->
    <div class="px-5 mb-4">
      <ShortcutGrid />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * HomeView.vue —— 智能家居首页
 * 职责：组合子组件 & 传递路由事件，业务逻辑由 useSmartDevices 管理
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BellIcon, UserCircleIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/utils/config'
import { useSmartDevices } from './composables/useSmartDevices'
import OverviewCard    from './components/OverviewCard.vue'
import SceneGrid       from './components/SceneGrid.vue'
import HomeDeviceGrid  from './components/HomeDeviceGrid.vue'
import ShortcutGrid    from './components/ShortcutGrid.vue'
import type { SmartDevice } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { devices, onDevicesCount, toggleDevice } = useSmartDevices()

/** 用户头像缩略图 URL */
const avatarUrl = computed(() => {
  const refId = authStore.userInfo.avatar
  if (!refId) return ''
  return `${API_BASE_URL}/oss/getPublicFileThumbnail?ossObjectRefId=${encodeURIComponent(refId)}&imageWidth=128`
})

/** 用户显示名称 */
const userName = computed(() => authStore.userInfo.name || '智能家居')

/** 设备卡片点击：空调跳转遥控页 */
function handleCardClick(device: SmartDevice) {
  if (device.type === 'ac') router.push('/ac-remote')
}
</script>
