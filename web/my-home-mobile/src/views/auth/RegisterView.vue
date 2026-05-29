<template>
  <div
    data-cmp="RegisterView"
    class="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden"
    style="background: linear-gradient(160deg, #181a3a 0%, #23206b 45%, #3b2070 100%)"
  >
    <div class="absolute top-[-60px] right-[-40px] w-56 h-56 rounded-full opacity-20" style="background: radial-gradient(circle, #a78bfa 0%, transparent 70%)" />
    <div class="absolute bottom-[240px] left-[-70px] w-44 h-44 rounded-full opacity-15" style="background: radial-gradient(circle, #5b5de8 0%, transparent 70%)" />

    <div class="relative z-10 flex flex-col flex-1 px-7 pt-16 pb-12">
      <button
        @click="router.push('/login')"
        class="flex items-center gap-1.5 text-sm mb-10 w-fit"
        style="color: rgba(255,255,255,0.45)"
      >
        <ArrowLeftIcon :size="16" :stroke-width="2.5" />
        返回登录
      </button>

      <div class="mb-10">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style="background: rgba(255,255,255,0.12)">
          <span class="text-3xl">✨</span>
        </div>
        <div class="text-white text-[2rem] font-bold leading-tight tracking-tight">创建账户</div>
        <div class="text-white/50 text-sm mt-1.5 font-normal">加入智慧家居，开启全新体验</div>
      </div>

      <div class="flex flex-col gap-3.5 mb-5">
        <div
          class="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
          style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10)"
        >
          <UserIcon :size="17" class="flex-shrink-0" style="color: rgba(255,255,255,0.45)" :stroke-width="2" />
          <input v-model="name" type="text" placeholder="昵称" class="flex-1 bg-transparent text-sm outline-none" style="color: rgba(255,255,255,0.9)" />
        </div>

        <div
          class="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
          style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10)"
        >
          <PhoneIcon :size="17" class="flex-shrink-0" style="color: rgba(255,255,255,0.45)" :stroke-width="2" />
          <input v-model="phone" type="tel" placeholder="手机号" class="flex-1 bg-transparent text-sm outline-none" style="color: rgba(255,255,255,0.9)" />
        </div>

        <div
          class="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
          style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10)"
        >
          <LockIcon :size="17" class="flex-shrink-0" style="color: rgba(255,255,255,0.45)" :stroke-width="2" />
          <input v-model="password" :type="showPwd ? 'text' : 'password'" placeholder="设置密码" class="flex-1 bg-transparent text-sm outline-none" style="color: rgba(255,255,255,0.9)" />
          <button @click="showPwd = !showPwd" class="flex-shrink-0">
            <EyeOffIcon v-if="showPwd" :size="16" :stroke-width="2" style="color: rgba(255,255,255,0.40)" />
            <EyeIcon v-else :size="16" :stroke-width="2" style="color: rgba(255,255,255,0.40)" />
          </button>
        </div>

        <div
          class="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
          style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.10)"
        >
          <LockIcon :size="17" class="flex-shrink-0" style="color: rgba(255,255,255,0.45)" :stroke-width="2" />
          <input v-model="confirm" :type="showPwd ? 'text' : 'password'" placeholder="确认密码" class="flex-1 bg-transparent text-sm outline-none" style="color: rgba(255,255,255,0.9)" />
          <div class="flex-shrink-0 transition-opacity" :class="confirm && confirm === password ? 'opacity-100' : 'opacity-0'">
            <CheckIcon :size="16" :stroke-width="2.5" style="color: #34d399" />
          </div>
        </div>
      </div>

      <button @click="agreed = !agreed" class="flex items-center gap-2 mb-6">
        <div
          class="w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0"
          :style="{
            background: agreed ? '#5b5de8' : 'rgba(255,255,255,0.08)',
            border: agreed ? '2px solid #5b5de8' : '2px solid rgba(255,255,255,0.18)'
          }"
        >
          <CheckIcon :size="11" :stroke-width="3" style="color: #fff" />
        </div>
        <span class="text-xs" style="color: rgba(255,255,255,0.40)">
          我已阅读并同意
          <span style="color: rgba(167,139,250,0.85)"> 用户协议 </span>
          和
          <span style="color: rgba(167,139,250,0.85)"> 隐私政策</span>
        </span>
      </button>

      <button
        @click="handleRegister"
        :disabled="loading"
        class="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl text-sm active:opacity-80 transition-opacity mb-6"
        style="background: linear-gradient(90deg, #5b5de8 0%, #8b5cf6 100%); color: #fff"
      >
        {{ loading ? '注册中...' : '立即注册' }}
      </button>

      <div class="flex items-center justify-center gap-1.5">
        <span class="text-sm" style="color: rgba(255,255,255,0.38)">已有账号？</span>
        <RouterLink to="/login" class="text-sm font-semibold" style="color: rgba(167,139,250,1)">去登录</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { UserIcon, LockIcon, PhoneIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, CheckIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { systemAuthRegister } from '@/api'

const router = useRouter()
const name = ref('')
const phone = ref('')
const password = ref('')
const confirm = ref('')
const showPwd = ref(false)
const agreed = ref(false)
const loading = ref(false)

/** 注册：调用后端接口，成功则跳转登录页 */
async function handleRegister() {
  if (!name.value.trim() || !phone.value.trim() || !password.value.trim()) {
    toast.error('请填写所有必填信息')
    return
  }
  if (password.value !== confirm.value) {
    toast.error('两次密码输入不一致')
    return
  }
  if (!agreed.value) {
    toast.error('请先同意用户协议')
    return
  }
  loading.value = true
  try {
    await systemAuthRegister({
      userAccount: phone.value.trim(),
      password: password.value,
      userName: name.value.trim(),
    })
    toast.success('注册成功，请登录')
    router.push('/login')
  } catch {
    // 网络异常等已在拦截器中通过 toast 提示
  } finally {
    loading.value = false
  }
}
</script>
