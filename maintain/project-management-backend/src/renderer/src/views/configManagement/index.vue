<!--
  @file 配置管理页
  @description 配置管理页面入口，当前为占位页
-->
<script setup lang="ts">
defineOptions({ name: 'configManagement' })
</script>

<template>
  <div class="config">
    <el-card shadow="never">
      <template #header>
        <span>配置管理</span>
      </template>
      <el-empty description="配置管理功能建设中" :image-size="120" />
    </el-card>
  </div>
</template>
