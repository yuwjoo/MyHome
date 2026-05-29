<template>
  <div class="cloud-disk">
    <!-- 头部栏 -->
    <header-bar class="cloud-disk__header-bar" :dir-path="dirPath" @change="fileListRef?.resetData()" />

    <!-- 面包屑卡片 -->
    <breadcrumb-card class="cloud-disk__breadcrumb-card" v-model="dirPath" @change="fileListRef?.resetData()" />

    <!-- 文件列表 -->
    <file-list class="cloud-disk__file-list" ref="fileListRef" v-model="dirPath" />
  </div>
</template>

<script setup lang="ts">
import BreadcrumbCard from "./components/breadcrumbCard/BreadcrumbCard.vue";
import FileList from "./components/fileList/FileList.vue";
import HeaderBar from "./components/headerBar/HeaderBar.vue";

const dirPath = ref("/"); // 目录路径

const fileListRef = useTemplateRef("fileListRef"); // 文件列表 ref
</script>

<style scoped lang="scss">
.cloud-disk {
  padding: 16px 16px calc(80px + 16px);
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;

  .cloud-disk__breadcrumb-card {
    margin-top: 20px;
  }

  .cloud-disk__file-list {
    flex-grow: 1;
  }
}
</style>
