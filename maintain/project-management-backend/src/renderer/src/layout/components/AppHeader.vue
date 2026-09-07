<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="app-header">
    <div class="app-header__brand">
      <div class="app-header__logo">PM</div>
      <span class="app-header__name">项目管理平台</span>
    </div>
    <span class="app-header__current">{{ route.meta.title ?? '' }}</span>
    <div class="app-header__actions">
      <!-- 预留操作区：窗口控制、用户入口等 -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;

  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--el-color-primary);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
  }

  &__current {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__actions {
    margin-left: auto;
  }
}
</style>
