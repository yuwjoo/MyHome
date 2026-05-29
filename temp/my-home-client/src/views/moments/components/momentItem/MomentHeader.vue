<template>
  <div class="moment-header">
    <img :src="avatar" alt="头像" class="moment-header__avatar" />
    <div class="moment-header__info">
      <div class="moment-header__username">{{ username }}</div>
      <div class="moment-header__time">{{ formatTime(createTime) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props定义
interface Props {
  username: string;
  avatar: string;
  createTime: string;
}

withDefaults(defineProps<Props>(), {
  username: "",
  avatar: "",
  createTime: ""
});

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return "";

  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return "刚刚";
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
      2,
      "0"
    )}`;
  }
};
</script>

<style lang="scss" scoped>
.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
  }

  &__info {
    flex: 1;
  }

  &__username {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
    color: $font-color-dd;
  }

  &__time {
    font-size: 12px;
    color: #999;
  }
}
</style>
