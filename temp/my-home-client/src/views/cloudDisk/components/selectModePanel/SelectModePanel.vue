<template>
  <teleport to="body">
    <!-- 头部操作栏 -->
    <transition name="slide-down-up">
      <header-action-bar v-show="isVisible" v-model="selectFilePathList" :file-list="fileList" />
    </transition>

    <!-- 底部操作栏 -->
    <transition name="slide-up-down">
      <footer-action-bar v-show="isVisible" v-model="selectFilePathList" />
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { selectModePanelModels, selectModePanelProps } from "./define/props";
import HeaderActionBar from "./components/HeaderActionBar.vue";
import FooterActionBar from "./components/FooterActionBar.vue";

defineProps(selectModePanelProps);

const selectFilePathList = defineModel(selectModePanelModels.modelValue); // 选择的文件路径列表

const isVisible = computed(() => !!selectFilePathList.value.length); // 是否显示面板
</script>

<style lang="scss" scoped>
// 从上往下进入
.slide-down-up-enter-from,
.slide-down-up-leave-to {
  transform: translateY(-100px);
}
.slide-down-up-enter-to,
.slide-down-up-leave-from {
  transform: translateY(0);
}
.slide-down-up-enter-active,
.slide-down-up-leave-active {
  transition: all 0.3s ease-in-out;
}

// 从下往上进入
.slide-up-down-enter-from,
.slide-up-down-leave-to {
  transform: translateY(100px);
}
.slide-up-down-enter-to,
.slide-up-down-leave-from {
  transform: translateY(0);
}
.slide-up-down-enter-active,
.slide-up-down-leave-active {
  transition: all 0.3s ease-in-out;
}
</style>
