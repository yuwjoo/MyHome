<script setup lang="ts">
/**
 * 注册页
 * - 注册成功后自动登录（注册事务在服务端异步提交，需短暂重试），
 *   重试仍失败则回登录页并预填账号
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { showToast } from '@/composables/toast'
import AppIcon from '@/components/AppIcon.vue'
import PasswordInput from '@/components/PasswordInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const userName = ref('')
const account = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请重试'
}

/** 注册成功后自动登录（等服务端事务提交完成） */
async function autoLogin(accountName: string): Promise<boolean> {
  for (let i = 0; i < 8; i += 1) {
    await sleep(600)
    try {
      const result = await authApi.login({ userAccount: accountName, password: password.value })
      authStore.login(result.token, result.user)
      return true
    } catch {
      // 尚未就绪，继续重试
    }
  }
  return false
}

async function handleRegister(): Promise<void> {
  const trimmedName = userName.value.trim()
  const accountName = account.value.trim()
  if (!trimmedName) {
    showToast('给自己起个称呼吧', 'error')
    return
  }
  if (!/^[A-Za-z0-9_]{3,20}$/.test(accountName)) {
    showToast('账号需为 3-20 位字母、数字或下划线', 'error')
    return
  }
  if (password.value.length < 6) {
    showToast('密码至少 6 位', 'error')
    return
  }
  if (password.value !== confirmPassword.value) {
    showToast('两次输入的密码不一致', 'error')
    return
  }
  if (submitting.value) return

  submitting.value = true
  try {
    await authApi.register({
      userAccount: accountName,
      password: password.value,
      userName: trimmedName,
    })
    const logged = await autoLogin(accountName)
    if (logged) {
      showToast('注册成功，欢迎加入', 'success')
      router.replace('/')
    } else {
      showToast('注册成功，请登录', 'info')
      router.replace({ path: '/login', query: { account: accountName } })
    }
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
        <h1 class="auth-card__title">注册账号</h1>
        <p class="auth-card__sub">创建一个账号，把家常味道安心存到云端</p>
      </header>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="auth-form__group">
          <label class="field__label" for="reg-name">称呼</label>
          <input
            id="reg-name"
            v-model="userName"
            class="input"
            type="text"
            maxlength="20"
            placeholder="怎么称呼你？"
            autocomplete="nickname"
          />
        </div>

        <div class="auth-form__group">
          <label class="field__label" for="reg-account">账号</label>
          <input
            id="reg-account"
            v-model="account"
            class="input"
            type="text"
            maxlength="20"
            placeholder="3-20 位字母、数字或下划线"
            autocomplete="username"
          />
        </div>

        <div class="auth-form__group">
          <label class="field__label" for="reg-password">密码</label>
          <PasswordInput
            id="reg-password"
            v-model="password"
            placeholder="至少 6 位"
            autocomplete="new-password"
          />
        </div>

        <div class="auth-form__group">
          <label class="field__label" for="reg-confirm">确认密码</label>
          <PasswordInput
            id="reg-confirm"
            v-model="confirmPassword"
            placeholder="再输入一次密码"
            autocomplete="new-password"
          />
        </div>

        <button
          type="submit"
          class="btn btn--primary btn--block auth-form__submit"
          :disabled="submitting"
        >
          <AppIcon v-if="submitting" name="clock" :size="1.125" />
          <span>{{ submitting ? '注册中…' : '注册并登录' }}</span>
        </button>
      </form>

      <p class="auth-card__switch">
        已有账号？
        <router-link class="auth-card__link" to="/login">直接登录</router-link>
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
