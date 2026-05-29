<template>
  <div class="moments-header">
    <div class="moments-header__content">
      <i-tabler:search class="moments-header__icon-btn" @click="handleSearchClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

// 处理搜索按钮点击事件
const handleSearchClick = () => {
  router.push("/moments/search");
};
</script>

<style lang="scss" scoped>
$header-height: 50px;

.moments-header {
  height: $header-height;

  &__content {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 99;
    width: 100%;
    height: $header-height;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    box-sizing: border-box;
    padding: 0 16px;
    background-color: white;
    font-size: 24px;
    color: $font-color-d;
  }

  &__icon-btn {
    margin-left: 16px;
  }
}
</style>
