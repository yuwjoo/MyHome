<template>
  <div class="my">
    <div class="header">
      <div class="header__operation">
        <i-tabler:settings class="header__operation__settings" />
      </div>
    </div>

    <div class="user">
      <van-image
        class="user__avatar"
        src="https://q6.itc.cn/q_70/images03/20250306/355fba6a5cb049f5b98c2ed9f03cc5e1.jpeg"
        round
        fit="cover"
      />
      <div class="user__name">yuwjoo</div>
    </div>

    <base-card class="action-card" no-padding>
      <base-cell title="三方应用" is-link />
      <base-cell title="达人中心" is-link />
      <base-cell title="帮助与反馈" is-link />
      <base-cell title="关于" is-link />
    </base-card>

    <base-card class="logout-card" no-padding>
      <base-cell clickable value-align="center" @click="handleLogout">
        <template #value>
          <span style="color: #ef4444">退出登录</span>
        </template>
      </base-cell>
    </base-card>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from "@/store/auth";
import BaseCard from "@/components-2/base/baseCard/BaseCard.vue";
import BaseCell from "@/components-2/base/baseCell/BaseCell.vue";

const authStore = useAuthStore();

/**
 * 处理退出登录
 */
const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: "提示",
      message: "确定要退出登录吗？"
    });
    authStore.logout();
  } catch {
    // 用户取消
  }
};
</script>

<style lang="scss" scoped>
.my {
  padding: 16px 16px calc(80px + 16px);
}

// 顶部header
.header {
  height: 30px;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  .header__operation {
    font-size: 24px;
    display: flex;
    align-items: center;
  }
}

// 用户
.user {
  display: flex;
  align-items: center;
  margin-top: 16px;
  padding-left: 4px;

  .user__avatar {
    width: 40px;
    height: 40px;
  }

  .user__name {
    color: #262626;
    font-size: 20px;
    margin-left: 12px;
    font-weight: bold;
  }
}

// 动作卡片
.action-card {
  margin: 32px 0 0;
}

// 退出卡片
.logout-card {
  margin: 16px 0 0;
}
</style>
