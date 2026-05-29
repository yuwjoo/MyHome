<template>
  <van-search class="search-input" v-model="searchValue" placeholder="文件搜索" readonly @click="onClickSearch" />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const searchValue = defineModel<string>(); // 模糊搜索值

/**
 * 点击搜索框，跳转到搜索页面
 */
const onClickSearch = () => {
  router.push({ name: "cloud-drive-search" });
};
</script>

<style lang="scss" scoped>
.search-input {
  padding: 10px;
  background-color: #fff;
  border-bottom: 1px solid #ebedf0;
}
</style>
