<script setup lang="ts">
/**
 * 登录页
 * - 账号密码登录后端 /system/auth/login
 * - 登录成功回跳 redirect（默认首页）
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { showToast } from '@/composables/toast'
import AppIcon from '@/components/AppIcon.vue'
import PasswordInput from '@/components/PasswordInput.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const account = ref('')
const password = ref('')
const submitting = ref(false)

/** 错误信息取 e.message（ApiError/网络错误均已处理为用户可读文案） */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请重试'
}

/** 登录成功后的落点（仅接受站内路径） */
function redirectTarget(): string {
  const raw = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return raw.startsWith('/') ? raw : '/'
}

async function handleLogin(): Promise<void> {
  const accountName = account.value.trim()
  if (!accountName) {
    showToast('请输入账号', 'error')
    return
  }
  if (!password.value) {
    showToast('请输入密码', 'error')
    return
  }
  if (submitting.value) return

  submitting.value = true
  try {
    const result = await authApi.login({ userAccount: accountName, password: password.value })
    authStore.login(result.token, result.user)
    showToast('欢迎回来', 'success')
    router.replace(redirectTarget())
  } catch (error) {
    showToast(messageOf(error), 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <header class="auth-card__brand">
        <p class="auth-card__slogan">好好吃饭 · 认真生活</p>
        <h1 class="auth-card__title">我的菜谱</h1>
        <p class="auth-card__sub">登录后，菜谱与影像将同步到云端</p>
      </header>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="auth-form__group">
          <label class="field__label" for="login-account">账号</label>
          <input
            id="login-account"
            v-model="account"
            class="input"
            type="text"
            placeholder="请输入账号"
            autocomplete="username"
            autofocus
          />
        </div>

        <div class="auth-form__group">
          <label class="field__label" for="login-password">密码</label>
          <PasswordInput
            id="login-password"
            v-model="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn--primary btn--block auth-form__submit" :disabled="submitting">
          <AppIcon v-if="submitting" name="clock" :size="1.125" />
          <span>{{ submitting ? '登录中…' : '登录' }}</span>
        </button>
      </form>

      <p class="auth-card__switch">
        还没有账号？
        <router-link class="auth-card__link" to="/register">注册一个新账号</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 全屏暖色氛围 + 居中卡片 */
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(120% 90% at 15% 0%, rgba(232, 148, 66, 0.2), transparent 55%),
    radial-gradient(120% 90% at 90% 100%, rgba(214, 122, 63, 0.16), transparent 55%),
    linear-gradient(165deg, var(--color-brand-50), var(--color-paper) 60%);
}

.auth-card {
  width: 100%;
  max-width: 23rem;
  padding: 2.25rem 1.75rem 1.75rem;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);

  &__brand {
    text-align: center;
    margin-bottom: 1.75rem;
  }

  &__slogan {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    letter-spacing: 0.16em;
    color: var(--color-brand-500);
    font-weight: 600;
  }

  &__title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-ink-900);
    letter-spacing: 0.02em;
  }

  &__sub {
    margin: 0.625rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-ink-500);
  }

  &__switch {
    margin: 1.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-ink-500);
    text-align: center;
  }

  &__link {
    color: var(--color-brand-600);
    font-weight: 600;
    text-decoration: none;

    &:active {
      opacity: 0.7;
    }
  }
}

.auth-form {
  &__group {
    margin-bottom: 1.125rem;
  }

  &__submit {
    margin-top: 1.5rem;
  }
}
</style>
