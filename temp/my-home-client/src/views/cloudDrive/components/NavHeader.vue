<template>
  <div class="nav-header">
    <div class="nav-header-back">
      <i-tabler:chevron-left v-if="currentPath" class="nav-header-back__icon" @click="onBack" />
      <div class="nav-header-back__path">{{ currentPath || "全部" }}</div>
    </div>
    <div class="nav-header-action">
      <i-tabler:transfer-vertical class="nav-header-action__icon" @click="onJumpTransfer" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  dirPath: string; // 目录路径
}>();

const emit = defineEmits<{
  (e: "back"): void;
}>();

const currentPath = computed(() => props.dirPath.split("/").slice(-1)[0]); // 当前路径

/**
 * 监听页面回退
 */
const onBack = () => {
  emit("back");
};

/**
 * 监听跳转传输页
 */
const onJumpTransfer = () => {
  console.log("跳转");
};
</script>

<style lang="scss" scoped>
.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #3b3b3b;
  padding: 12px 16px;
}

.nav-header-back {
  display: flex;
  align-items: center;
  width: 0;
  flex-grow: 1;

  &__icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  &__path {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.nav-header-action {
  &__icon {
    font-size: 20px;
  }
}
</style>
