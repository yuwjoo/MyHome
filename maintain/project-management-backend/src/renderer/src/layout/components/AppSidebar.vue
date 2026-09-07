<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { appMenus } from '../menu'

const route = useRoute()

// 高亮与当前路由路径一致的菜单项
const activeMenu = computed(() => route.path)
</script>

<template>
  <el-menu
    class="app-sidebar__menu"
    router
    :default-active="activeMenu"
  >
    <el-menu-item v-for="item in appMenus" :key="item.path" :index="item.path">
      <el-icon><component :is="item.icon" /></el-icon>
      <span>{{ item.title }}</span>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.app-sidebar__menu {
  height: 100%;
  border-right: none;
}
</style>
