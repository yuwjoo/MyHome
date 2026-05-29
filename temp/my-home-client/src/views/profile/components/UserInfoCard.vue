<!-- 
  * @FileName: UserInfoCard.vue
 * @FilePath: \my-home-client\src\views\profile\components\UserInfoCard.vue
  * @Author: YH
  * @Date: 2025-12-20 19:00:00
 * @LastEditors: YH
 * @LastEditTime: 2025-12-20 21:26:57
  * @Description: 用户信息卡片组件
 -->

<template>
  <div class="user-info-card">
    <div class="avatar-container" @click="handleAvatarClick">
      <img :src="userInfo.avatar" alt="用户头像" class="avatar" />
      <div class="avatar-edit-badge">
        <span class="edit-icon">编辑</span>
      </div>
    </div>
    <div class="user-details">
      <h2 class="nickname">{{ userInfo.nickname }}</h2>
      <p class="user-id">ID: {{ userInfo.id }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

// 定义组件属性
interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
}

defineProps<{
  userInfo: UserInfo;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: "edit-avatar"): void;
}>();

// 处理头像点击事件
const handleAvatarClick = () => {
  emit("edit-avatar");
};
</script>

<style scoped lang="scss">
@import "@/assets/style/variable.scss";

.user-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: $font-color-ll;
  padding: 30px 20px;
  display: flex;
  align-items: center;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  margin-bottom: 20px;

  // 头像容器
  .avatar-container {
    position: relative;
    margin-right: 20px;
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    // 头像样式
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.8);
      object-fit: cover;
    }

    // 编辑徽章
    .avatar-edit-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      background-color: rgba(0, 0, 0, 0.5);
      color: $font-color-ll;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: $font-size-small;
    }
  }

  // 用户详情
  .user-details {
    flex: 1;

    .nickname {
      margin: 0 0 8px 0;
      font-size: $font-size-large-xx;
      font-weight: bold;
    }

    .user-id {
      margin: 0;
      font-size: $font-size-small;
      opacity: 0.8;
    }
  }
}
</style>
