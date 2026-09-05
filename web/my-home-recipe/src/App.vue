<script setup lang="ts">
import { RouterView } from 'vue-router'

import ToastHost from '@/components/ToastHost.vue'
</script>

<template>
  <!-- 根布局：桌面宽屏下呈现居中的“手机壳” -->
  <div class="app-root">
    <div class="app-frame">
      <RouterView v-slot="{ Component, route }">
        <!-- 按路由路径切换时重挂载，以触发过渡动画 -->
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>

      <!-- 全局轻提示宿主（组件内无需手动引入） -->
      <ToastHost />
    </div>
  </div>
</template>
