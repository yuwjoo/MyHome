<template>
  <div
    data-cmp="LoginView"
    class="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden"
    style="background: linear-gradient(160deg, #181a3a 0%, #23206b 45%, #3b2070 100%)"
  >
    <div class="absolute top-[-80px] right-[-60px] w-64 h-64 rounded-full opacity-20" style="background: radial-gradient(circle, #a78bfa 0%, transparent 70%)" />
    <div class="absolute bottom-[200px] left-[-80px] w-48 h-48 rounded-full opacity-15" style="background: radial-gradient(circle, #5b5de8 0%, transparent 70%)" />

    <div class="relative z-10 flex flex-col flex-1 px-7 pt-24 pb-12">
      <div class="mb-14">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style="background: rgba(255,255,255,0.12)">
          <span class="text-3xl">🏠</span>
        </div>
        <div class="text-white text-[2rem] font-bold leading-tight tracking-tight">欢迎回家</div>
        <div class="text-white/50 text-sm mt-1.5 font-normal">登录你的账户，继续使用</div>
      </div>

      <div class="flex flex-col gap-3.5 mb-6">
        <div
          class="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
          style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10)"
        >
          <UserIcon :size="17" class="flex-shrink-0" style="color: rgba(255,255,255,0.45)" :stroke-width="2" />
          <input
            v-model="phone"
            type="text"
            placeholder="手机号 / 账号"
            class="flex-1 bg-transparent text-sm outline-none"
            style="color: rgba(255,255,255,0.9)"
          />
        </div>

        <div
          class="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
          style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10)"
        >
          <LockIcon :size="17" class="flex-shrink-0" style="color: rgba(255,255,255,0.45)" :stroke-width="2" />
          <input
            v-model="password"
            :type="showPwd ? 'text' : 'password'"
            placeholder="密码"
            class="flex-1 bg-transparent text-sm outline-none"
            style="color: rgba(255,255,255,0.9)"
          />
          <button @click="showPwd = !showPwd" class="flex-shrink-0">
            <EyeOffIcon v-if="showPwd" :size="16" :stroke-width="2" style="color: rgba(255,255,255,0.40)" />
            <EyeIcon v-else :size="16" :stroke-width="2" style="color: rgba(255,255,255,0.40)" />
          </button>
        </div>
      </div>

      <button
        @click="handleLogin"
        :disabled="loading"
        class="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl text-sm active:opacity-80 transition-opacity mb-8"
        style="background: linear-gradient(90deg, #5b5de8 0%, #8b5cf6 100%); color: #fff"
      >
        {{ loading ? '登录中...' : '登 录' }}
        <ArrowRightIcon :size="16" :stroke-width="2.5" :class="{ 'hidden': loading }" />
      </button>

      <div class="flex items-center justify-center gap-1.5">
        <span class="text-sm" style="color: rgba(255,255,255,0.38)">还没有账号？</span>
        <RouterLink to="/register" class="text-sm font-semibold" style="color: rgba(167,139,250,1)">立即注册</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { systemAuthLogin } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const phone = ref('')
const password = ref('')
const showPwd = ref(false)
const loading = ref(false)

/** 登录：调用后端接口，成功则保存 token 并跳转首页 */
async function handleLogin() {
  if (!phone.value.trim() || !password.value.trim()) {
    toast.error('请填写账号和密码')
    return
  }
  loading.value = true
  try {
    const response = await systemAuthLogin({
      userAccount: phone.value.trim(),
      password: password.value,
    })
    if (response.data.code === 20200) {
      toast.success('登录成功')
      authStore.login(response.data.data.token, response.data.data.user)
      // 有 redirect 参数则跳回原页面，否则去首页
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    }
  } catch {
    // 网络异常等已在拦截器中通过 toast 提示
  } finally {
    loading.value = false
  }
}
</script>
