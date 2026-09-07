<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
</script>

<template>
  <el-container class="app-layout">
    <el-header class="app-layout__header" height="56px">
      <AppHeader />
    </el-header>
    <el-container class="app-layout__body">
      <el-aside class="app-layout__aside" width="220px">
        <AppSidebar />
      </el-aside>
      <el-main class="app-layout__main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-layout {
  height: 100%;
}

.app-layout__header {
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
}

.app-layout__body {
  height: calc(100% - 56px);
  overflow: hidden;
}

.app-layout__aside {
  background: #fff;
  border-right: 1px solid var(--el-border-color-light);
}

.app-layout__main {
  padding: 16px;
  background: #f0f2f5;
  overflow: auto;
}
</style>
