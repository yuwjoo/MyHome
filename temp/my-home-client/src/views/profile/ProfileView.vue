<!-- 
  * @FileName: ProfileView.vue
 * @FilePath: \my-home-client\src\views\profile\ProfileView.vue
  * @Author: YH
 * @Date: 2025-11-30 22:43:54
 * @LastEditors: YH
 * @LastEditTime: 2026-01-16 21:50:26
  * @Description: 个人中心页面组件
 -->

<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <UserInfoCard :user-info="userInfo" @edit-avatar="handleEditAvatar" />

    <!-- 功能选项列表 -->
    <div class="options-section">
      <!-- 深色模式切换 -->
      <OptionItem icon="🌙" text="深色模式" @click="toggleDarkMode">
        <template #right>
          <van-switch v-model="isDarkMode" size="20px" />
        </template>
      </OptionItem>

      <OptionItem icon="ℹ️" text="小车遥控器" @click="handleToCarRemoteControl" />

      <!-- 其他功能选项 -->
      <OptionItem icon="ℹ️" text="关于" @click="handleShowAbout" />

      <OptionItem icon="🚪" text="退出登录" @click="handleLogout" :is-last="true" />
    </div>

    <!-- 头像选择器 -->
    <AvatarPicker v-model="avatarPickerVisible" @avatar-selected="handleAvatarSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useThemeStore } from "@/store/theme";
import { getUserInfo, updateAvatar } from "@/api/profile";
import { useAuthStore } from "@/store/auth";
import { showToast } from "vant";

// 导入组件
import UserInfoCard from "./components/UserInfoCard.vue";
import OptionItem from "./components/OptionItem.vue";
import AvatarPicker from "./components/AvatarPicker.vue";
import { useRouter } from "@/router";

// 状态管理
const themeStore = useThemeStore();
const authStore = useAuthStore();

const router = useRouter();

// 用户信息
const userInfo = ref({
  id: "1234567890",
  nickname: "MYHOME",
  avatar: "https://img.icons8.com/color/200/user-male-circle--v1.png"
});

// 头像选择器可见状态
const avatarPickerVisible = ref(false);

// 深色模式状态
const isDarkMode = computed({
  get: () => themeStore.theme === "dark",
  set: (value) => {
    themeStore.theme = value ? "dark" : "light";
  }
});

const handleToCarRemoteControl = () => {
  router.push({ name: "carRemoteControl" });
};

/**
 * @description: 切换深色模式
 * @return {void}
 */
const toggleDarkMode = () => {
  themeStore.theme = themeStore.theme === "dark" ? "light" : "dark";
};

/**
 * @description: 处理编辑头像
 * @return {void}
 */
const handleEditAvatar = () => {
  avatarPickerVisible.value = true;
};

/**
 * @description: 处理头像选择完成
 * @param {string} avatarUrl - 选择的头像URL
 * @return {Promise<void>}
 */
const handleAvatarSelected = async (avatarUrl: string) => {
  try {
    await updateAvatar(avatarUrl);
    userInfo.value.avatar = avatarUrl;
    showToast({ message: "头像更新成功", type: "success" });
  } catch (error) {
    console.error("更新头像失败:", error);
    showToast({ message: "更新头像失败", type: "fail" });
  }
};

/**
 * @description: 显示关于页面
 * @return {void}
 */
const handleShowAbout = () => {
  // 在实际应用中，这里会跳转到关于页面
  alert("我的家 v1.0.0\n让智能家居管理更简单");
};

/**
 * @description: 处理退出登录
 * @return {void}
 */
const handleLogout = () => {
  if (confirm("确定要退出登录吗？")) {
    try {
      authStore.logout();
      showToast({ message: "退出登录成功", type: "success" });
    } catch (error) {
      console.error("退出登录失败:", error);
      showToast({ message: "退出登录失败", type: "fail" });
    }
  }
};

/**
 * @description: 初始化用户信息
 * @return {Promise<void>}
 */
const initUserInfo = async () => {
  try {
    const data = await getUserInfo();
    userInfo.value = data;
  } catch (error) {
    console.error("获取用户信息失败:", error);
    // 使用默认值
  }
};

// 组件挂载时初始化
onMounted(() => {
  initUserInfo();
});
</script>

<style scoped lang="scss">
@import "@/assets/style/variable.scss";

.profile-page {
  min-height: 100%;
  background-color: $background-color-m;

  // 功能选项部分
  .options-section {
    background-color: $background-color;
    border-radius: 12px;
    margin: 0 20px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
}
</style>
