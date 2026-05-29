<script setup lang="ts">
/**
 * App.vue —— 根组件
 * hideNav: 路由 meta 字段控制底部导航显示，无需维护硬编码路径列表
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useAppStore } from '@/stores/app'
import { useNativeBridge } from '@/composables/useNativeBridge'
import BottomNav from '@/components/BottomNav.vue'

const route    = useRoute()
const appStore = useAppStore()

/** 登录态 & 路由不要求隐藏导航时，显示底部 Nav */
const showNav = computed(() => appStore.isLoggedIn && !route.meta.hideNav)

/** Native 沉浸式安全区域：仅 Android / HarmonyOS App 环境生效 */
const { safeAreaTop, isReady } = useNativeBridge()

const contentStyle = computed(() =>
  isReady.value && safeAreaTop.value > 0
    ? { paddingTop: `${safeAreaTop.value}px` }
    : {},
)
</script>

<template>
  <Toaster position="top-center" richColors />
  <div :style="contentStyle">
    <RouterView />
  </div>
  <div v-show="showNav">
    <BottomNav />
  </div>
</template>
