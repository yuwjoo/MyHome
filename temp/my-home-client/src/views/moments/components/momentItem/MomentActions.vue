<template>
  <div class="moment-actions">
    <div class="moment-actions__item" @click="handleAction('like')">
      <i-tabler:heart class="moment-actions__icon" :class="{ 'moment-actions__icon--liked': liked }" />
      <span class="moment-actions__text" :class="{ 'moment-actions__text--liked': liked }">{{ likes || 0 }}</span>
    </div>
    <div class="moment-actions__item" @click="handleAction('comment')">
      <i-tabler:message-circle class="moment-actions__icon" />
      <span class="moment-actions__text">{{ commentCount || 0 }}</span>
    </div>
    <div class="moment-actions__item" @click="handleAction('share')">
      <i-tabler:share-3 class="moment-actions__icon" />
      <span class="moment-actions__text">分享</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props定义
interface Props {
  likes?: number;
  commentCount?: number;
  liked?: boolean;
}

withDefaults(defineProps<Props>(), {
  likes: 0,
  commentCount: 0,
  liked: false
});

// Emits定义
const emit = defineEmits<{
  action: [type: "like" | "comment" | "share"];
}>();

// 处理操作点击
const handleAction = (type: "like" | "comment" | "share") => {
  emit("action", type);
};
</script>

<style lang="scss" scoped>
.moment-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #eee;

  &__item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
    padding: 4px 8px;
    border-radius: 4px;

    &:hover {
      color: #1989fa;
      background-color: rgba(25, 137, 250, 0.05);
    }
  }

  &__icon {
    font-size: 16px;
  }

  &__text {
    font-size: 14px;
  }

  &__icon--liked {
    color: #ff4d4f;
    fill: #ff4d4f;
  }

  &__text--liked {
    color: #ff4d4f;
  }
}
</style>
