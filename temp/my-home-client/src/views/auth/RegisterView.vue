<!-- 
  * @FileName: RegisterView.vue
 * @FilePath: \my-home-client\src\views\auth\RegisterView.vue
  * @Author: YH
  * @Date: 2025-11-30 22:43:54
 * @LastEditors: YH
 * @LastEditTime: 2026-05-11 21:19:25
  * @Description: 注册页面组件
 -->
<template>
  <div class="login-container">
    <div class="login-box" :class="{ 'keyboard-open': isKeyboardOpen }">
      <h2 class="login-title">创建账号</h2>

      <!-- 步骤条 -->
      <van-steps :active="currentStep" active-color="#07c160" finish-color="#07c160" class="register-steps">
        <van-step>基本信息</van-step>
        <van-step>设置密码</van-step>
        <van-step>上传头像</van-step>
      </van-steps>

      <!-- 注册表单 -->
      <van-form class="register-form" @submit="handleStepSubmit">
        <!-- 步骤1：基本信息 -->
        <div v-if="currentStep === 0">
          <!-- 用户名输入框 -->
          <van-field
            v-model="registerForm.username"
            name="username"
            label="用户名"
            placeholder="请设置用户名（3-20字符）"
            :error-message="errors.username"
            :disabled="isLoading"
            required
            @keyboard-height-change="handleKeyboardHeightChange"
          />

          <!-- 昵称输入框（可选） -->
          <van-field
            v-model="registerForm.nickname"
            name="nickname"
            label="昵称"
            placeholder="请输入昵称（不超过20字符）"
            :error-message="errors.nickname"
            :disabled="isLoading"
            @keyboard-height-change="handleKeyboardHeightChange"
          />
        </div>

        <!-- 步骤2：设置密码 -->
        <div v-if="currentStep === 1">
          <!-- 密码输入框 -->
          <van-field
            v-model="registerForm.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请设置密码（至少6位）"
            :error-message="errors.password"
            :disabled="isLoading"
            show-password
            required
            @keyboard-height-change="handleKeyboardHeightChange"
          />

          <!-- 确认密码输入框 -->
          <van-field
            v-model="registerForm.confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="请确认密码"
            :error-message="errors.confirmPassword"
            :disabled="isLoading"
            show-password
            required
            @keyboard-height-change="handleKeyboardHeightChange"
          />
        </div>

        <!-- 步骤3：上传头像 -->
        <div v-if="currentStep === 2">
          <!-- 头像上传 -->
          <div class="avatar-upload-section">
            <div class="avatar-label">头像</div>
            <van-uploader
              v-model="avatarFileList"
              :max-count="1"
              :after-read="handleAvatarUpload"
              :before-read="beforeAvatarRead"
              :disabled="isLoading"
              class="avatar-uploader"
            >
              <div class="avatar-uploader__preview">
                <van-image v-if="registerForm.avatar" :src="registerForm.avatar" round fit="cover" />
                <div v-else class="avatar-uploader__placeholder">
                  <van-icon name="plus" size="40" color="#ccc" />
                  <div class="avatar-uploader__text">点击上传头像</div>
                </div>
              </div>
            </van-uploader>
            <div v-if="errors.avatar" class="avatar-error">{{ errors.avatar }}</div>
          </div>
        </div>

        <!-- 步骤按钮 -->
        <div class="step-buttons">
          <van-button v-if="currentStep > 0" block @click="prevStep" :disabled="isLoading" class="step-button">
            上一步
          </van-button>

          <van-button
            v-if="currentStep < 2"
            type="primary"
            @click="nextStep"
            :loading="isLoading"
            :disabled="isLoading"
            class="step-button"
            block
          >
            下一步
          </van-button>

          <van-button
            v-if="currentStep === 2"
            type="primary"
            :loading="isLoading"
            :disabled="isLoading"
            native-type="submit"
            class="step-button"
            block
          >
            注册
          </van-button>
        </div>
      </van-form>

      <!-- 其他操作 -->
      <div class="login-footer">
        <span>已有账号？</span>
        <div class="login-link" @click="goToLogin">去登录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import type { RegisterForm } from "./types/registerView";
import { uploadFile } from "@/utils/oss";
import { showToast } from "vant";
import { systemAuthRegister } from "@/api/base";

const router = useRouter();

// 注册表单
const registerForm = reactive<RegisterForm>({
  username: "",
  nickname: "",
  password: "",
  confirmPassword: "",
  avatar: ""
});

// 错误信息
const errors = reactive({
  username: "",
  nickname: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone: "",
  avatar: ""
});

// 加载状态
const isLoading = ref(false);

// 键盘状态
const isKeyboardOpen = ref(false);

// 步骤控制
const currentStep = ref(0);

// 头像文件列表
const avatarFileList = ref([]);

// 处理键盘高度变化（移动端适配）
const handleKeyboardHeightChange = (height: number) => {
  isKeyboardOpen.value = height > 0;
};

// 跳转到登录页面
const goToLogin = () => {
  router.push("/auth/login");
};

// 下一步
const nextStep = () => {
  if (validateCurrentStep()) {
    currentStep.value++;
  }
};

// 上一步
const prevStep = () => {
  currentStep.value--;
};

/**
 * @description: 当前步骤表单验证函数
 * @return {boolean} 是否通过验证
 */
const validateCurrentStep = (): boolean => {
  let isValid = true;

  // 根据当前步骤验证相应字段
  switch (currentStep.value) {
    case 0:
      // 验证用户名
      errors.username = "";
      if (!registerForm.username.trim()) {
        errors.username = "请输入用户名";
        isValid = false;
      } else if (registerForm.username.trim().length < 3 || registerForm.username.trim().length > 20) {
        errors.username = "用户名长度应在3-20个字符之间";
        isValid = false;
      }

      // 验证昵称（如果填写）
      errors.nickname = "";
      if (registerForm.nickname && registerForm.nickname.length > 20) {
        errors.nickname = "昵称长度不能超过20个字符";
        isValid = false;
      }
      break;

    case 1:
      // 验证密码
      errors.password = "";
      if (!registerForm.password) {
        errors.password = "请输入密码";
        isValid = false;
      } else if (registerForm.password.length < 6) {
        errors.password = "密码至少需要6个字符";
        isValid = false;
      }

      // 验证确认密码
      errors.confirmPassword = "";
      if (registerForm.confirmPassword !== registerForm.password) {
        errors.confirmPassword = "两次输入的密码不一致";
        isValid = false;
      }
      break;

    case 2:
      // 头像验证 - 可选，所以不做强制验证
      errors.avatar = "";
      break;
  }

  return isValid;
};

/**
 * @description: 完整表单验证函数
 * @return {boolean} 是否通过验证
 */
const validateForm = (): boolean => {
  let isValid = true;

  // 重置错误信息
  errors.username = "";
  errors.nickname = "";
  errors.password = "";
  errors.confirmPassword = "";
  errors.avatar = "";

  // 验证用户名
  if (!registerForm.username.trim()) {
    errors.username = "请输入用户名";
    isValid = false;
  } else if (registerForm.username.trim().length < 3 || registerForm.username.trim().length > 20) {
    errors.username = "用户名长度应在3-20个字符之间";
    isValid = false;
  }

  // 验证昵称（如果填写）
  if (registerForm.nickname && registerForm.nickname.length > 20) {
    errors.nickname = "昵称长度不能超过20个字符";
    isValid = false;
  }

  // 验证密码
  if (!registerForm.password) {
    errors.password = "请输入密码";
    isValid = false;
  } else if (registerForm.password.length < 6) {
    errors.password = "密码至少需要6个字符";
    isValid = false;
  }

  // 验证确认密码
  if (registerForm.confirmPassword !== registerForm.password) {
    errors.confirmPassword = "两次输入的密码不一致";
    isValid = false;
  }

  return isValid;
};

/**
 * @description: 头像上传前的校验
 */
const beforeAvatarRead = (file) => {
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    showToast("图片大小不能超过 2MB");
    return false;
  }
  return true;
};

/**
 * @description: 处理头像上传
 */
const handleAvatarUpload = async (file) => {
  try {
    isLoading.value = true;
    errors.avatar = "";

    // 使用OSS上传头像
    const ossLink = await uploadFile({
      file: file.file,
      uploadDir: "avatars"
    });

    registerForm.avatar = ossLink;

    showToast({
      message: "头像上传成功",
      type: "success",
      duration: 1000
    });
  } catch (error) {
    console.error("头像上传失败:", error);
    errors.avatar = "头像上传失败，请重试";
    registerForm.avatar = "";
    avatarFileList.value = [];
    showToast({
      message: "头像上传失败",
      type: "fail",
      duration: 1500
    });
  } finally {
    isLoading.value = false;
  }
};

/**
 * @description: 处理步骤提交
 */
const handleStepSubmit = async () => {
  // 验证完整表单
  if (!validateForm()) {
    return;
  }

  try {
    isLoading.value = true;

    // 调用注册API
    await systemAuthRegister({
      userAccount: registerForm.username,
      password: registerForm.password,
      userName: registerForm.nickname || `用户${Date.now()}`
    });

    // 注册成功
    showToast({
      message: "注册成功，请登录",
      type: "success",
      duration: 1500
    });

    // 跳转到登录页面
    setTimeout(() => {
      router.replace("/auth/login");
    }, 1500);
  } finally {
    isLoading.value = false;
  }
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

.register-steps {
  margin-bottom: 24px;
}

.register-form {
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

// 头像上传样式
.avatar-upload-section {
  margin-bottom: 20px;
}

.avatar-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  display: block;
}

.avatar-uploader {
  display: flex;
  justify-content: center;
}

.avatar-uploader__preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  cursor: pointer;

  &:hover {
    border-color: #07c160;
    background-color: #f0f9f3;
  }
}

.avatar-uploader__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.avatar-uploader__text {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.avatar-error {
  color: #ee0a24;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}

::v-deep .van-image {
  width: 100%;
  height: 100%;
}

// 步骤按钮样式
.step-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.step-button {
  border-radius: 8px;
  font-size: 16px;
  height: 48px;
  line-height: 48px;

  &:not(:first-child) {
    margin-left: 16px;
  }
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

.login-link {
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

    &__label {
      width: 65px;
      font-size: 13px;
    }

    &__control {
      font-size: 14px;
    }
  }

  .register-steps {
    margin-bottom: 20px;
  }

  .avatar-uploader__preview {
    width: 100px;
    height: 100px;
  }

  .step-button {
    height: 45px;
    line-height: 45px;
    font-size: 15px;
  }
}
</style>
