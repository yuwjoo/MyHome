<!-- 
  * @FileName: AuthLayout.vue
 * @FilePath: \my-home-client\src\views\auth\components\AuthLayout.vue
  * @Author: YH
  * @Date: 2025-11-30 23:00:54
 * @LastEditors: YH
 * @LastEditTime: 2025-11-30 23:04:02
  * @Description: 认证页面布局组件
 -->

<template>
  <div class="auth-layout">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
/**
 * @description: 认证页面布局组件
 * @function: 提供统一的动画效果，处理路由组件的过渡显示
 * @component: 包含router-view和transition组件
 */
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  width: 100%;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
