<!-- 
  * @FileName: LoginView.vue
 * @FilePath: \my-home-client\src\views\auth\LoginView.vue
  * @Author: YH
  * @Date: 2025-11-30 22:43:54
 * @LastEditors: YH
 * @LastEditTime: 2026-05-11 21:01:54
  * @Description: 登录页面组件
 -->

<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">欢迎登录</h2>

      <van-form @submit="handleLogin" class="login-form">
        <van-field
          v-model="loginForm.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :error-message="errors.username"
          :disabled="isLoading.submit"
          required
          @keyboard-height-change="handleKeyboardHeightChange"
        />

        <van-field
          v-model="loginForm.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :error-message="errors.password"
          :disabled="isLoading.submit"
          show-password
          required
          @keyboard-height-change="handleKeyboardHeightChange"
        />

        <van-button
          type="primary"
          size="large"
          class="login-button"
          :loading="isLoading.submit"
          :disabled="isLoading.submit"
          native-type="submit"
        >
          登录
        </van-button>
      </van-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <div class="register-link" @click="goToRegister">立即注册</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";

// 登录表单
const loginForm = reactive({
  username: "",
  password: ""
});

// 状态
const isLoading = reactive({
  submit: false
});

const errors = reactive({
  username: "",
  password: ""
});

// 路由
const router = useRouter();
const route = useRoute();

// 认证store
const authStore = useAuthStore();

/**
 * @description: 表单验证函数
 * @return {boolean} 是否通过验证
 */
const validateForm = () => {
  let isValid = true;

  // 重置错误信息
  errors.username = "";
  errors.password = "";

  // 验证用户名
  if (!loginForm.username.trim()) {
    errors.username = "请输入用户名";
    isValid = false;
  }

  // 验证密码
  if (!loginForm.password) {
    errors.password = "请输入密码";
    isValid = false;
  }

  return isValid;
};

/**
 * @description: 处理键盘高度变化（移动端适配）
 * @param {number} height - 键盘高度
 */
const handleKeyboardHeightChange = (height: number) => {
  if (height > 0) {
    // 键盘弹出时的处理
    document.querySelector(".login-box")?.classList.add("keyboard-open");
  } else {
    // 键盘收起时的处理
    document.querySelector(".login-box")?.classList.remove("keyboard-open");
  }
};

/**
 * @description: 处理登录表单提交
 * @return {Promise<void>}
 */
const handleLogin = async () => {
  // 验证表单
  if (!validateForm()) {
    return;
  }

  try {
    isLoading.submit = true;

    // 调用登录API
    await authStore.login(loginForm);

    // 登录成功
    showToast({
      message: "登录成功",
      type: "success",
      duration: 1500
    });

    router.replace((route.query.redirectPath as string) ?? "/");
  } finally {
    isLoading.submit = false;
  }
};

/**
 * @description: 跳转到注册页面
 * @return {void}
 */
const goToRegister = () => {
  router.push("/auth/register");
};
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 30px 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &.keyboard-open {
    transform: translateY(-20px);
  }
}

.login-title {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
  font-size: 22px;
  font-weight: 600;
}

.login-form {
  margin-bottom: 20px;
}

::v-deep .van-field {
  margin-bottom: 20px;
  font-size: 15px;

  &__label {
    width: 70px;
    color: #666;
  }

  &__control {
    font-size: 15px;
    color: #333;
  }

  &__error-message {
    font-size: 12px;
  }
}

.login-button {
  width: 100%;
  margin-top: 10px;
  border-radius: 8px;
  font-size: 16px;
  height: 48px;
  line-height: 48px;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-align: center;
  color: #666;
  margin-top: 20px;
  font-size: 14px;
}

.register-link {
  font-size: 14px;
  color: #07c160 !important;
  padding: 0;
}

// 响应式设计
@media screen and (max-width: 375px) {
  .login-box {
    padding: 20px 16px;
  }

  .login-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  ::v-deep .van-field {
    margin-bottom: 16px;
  }
}
</style>
