<!--
  @file 应用根组件
  @description 渲染进程根节点，仅承载路由出口
-->
<script setup lang="ts">
defineOptions({ name: 'app' })
</script>

<template>
  <router-view />
</template>
