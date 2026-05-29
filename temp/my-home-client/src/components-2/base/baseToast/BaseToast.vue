<template>
  <van-toast v-model:show="isShow" forbid-click />
</template>

<script lang="ts" setup>
const isShow = ref(false); // 显示toast

/**
 * 显示toast
 */
const showToast = () => {
  isShow.value = true;
};

/**
 * 关闭toast
 */
const closeToast = () => {
  isShow.value = false;
};

defineExpose({ showToast, closeToast });
</script>
