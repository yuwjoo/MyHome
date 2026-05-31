<template>
  <div id="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
/**
 * App 根组件
 * 提供全局布局容器
 */
</script>

<style lang="scss" scoped>
#app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
