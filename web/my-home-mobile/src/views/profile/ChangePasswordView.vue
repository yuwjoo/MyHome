<template>
  <div
    data-cmp="ChangePasswordView"
    class="min-h-screen bg-background flex flex-col max-w-md mx-auto"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-10 pb-4">
      <button
        @click="router.back()"
        class="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-custom active:opacity-60 transition-opacity"
      >
        <ChevronLeftIcon :size="20" class="text-foreground" :stroke-width="2.5" />
      </button>
      <span class="text-base font-bold text-foreground">修改密码</span>
    </div>

    <!-- Form -->
    <div class="px-5 pt-6 flex flex-col gap-5">
      <!-- 旧密码 -->
      <div>
        <label class="block text-xs font-semibold text-muted-foreground mb-2 ml-1">
          旧密码
        </label>
        <div class="relative">
          <input
            v-model="oldPassword"
            :type="showOld ? 'text' : 'password'"
            class="w-full bg-card rounded-2xl px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
            placeholder="请输入旧密码"
            maxlength="30"
          />
          <button
            class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
            @click="showOld = !showOld"
          >
            <EyeIcon v-if="!showOld" :size="18" class="text-muted-foreground" :stroke-width="2" />
            <EyeOffIcon v-else :size="18" class="text-muted-foreground" :stroke-width="2" />
          </button>
        </div>
      </div>

      <!-- 新密码 -->
      <div>
        <label class="block text-xs font-semibold text-muted-foreground mb-2 ml-1">
          新密码
        </label>
        <div class="relative">
          <input
            v-model="newPassword"
            :type="showNew ? 'text' : 'password'"
            class="w-full bg-card rounded-2xl px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
            placeholder="请输入新密码（至少6位）"
            maxlength="30"
          />
          <button
            class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
            @click="showNew = !showNew"
          >
            <EyeIcon v-if="!showNew" :size="18" class="text-muted-foreground" :stroke-width="2" />
            <EyeOffIcon v-else :size="18" class="text-muted-foreground" :stroke-width="2" />
          </button>
        </div>
      </div>

      <!-- 确认新密码 -->
      <div>
        <label class="block text-xs font-semibold text-muted-foreground mb-2 ml-1">
          确认新密码
        </label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            class="w-full bg-card rounded-2xl px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
            placeholder="请再次输入新密码"
            maxlength="30"
          />
          <button
            class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
            @click="showConfirm = !showConfirm"
          >
            <EyeIcon v-if="!showConfirm" :size="18" class="text-muted-foreground" :stroke-width="2" />
            <EyeOffIcon v-else :size="18" class="text-muted-foreground" :stroke-width="2" />
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="errorMsg"
        class="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium"
      >
        {{ errorMsg }}
      </div>

      <!-- 提交按钮 -->
      <button
        class="w-full py-4 rounded-2xl font-semibold text-sm active:opacity-80 transition-opacity disabled:opacity-50"
        :class="canSubmit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
        :disabled="!canSubmit || submitting"
        @click="handleSubmit"
      >
        <span v-if="submitting" class="inline-flex items-center gap-2">
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          提交中...
        </span>
        <span v-else>确认修改</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeftIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { systemAuthChangePassword } from '@/api/modules/auth'

const router = useRouter()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const submitting = ref(false)

const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

/** 是否允许提交 */
const canSubmit = computed(() => {
  return oldPassword.value && newPassword.value && confirmPassword.value
})

/** 提交修改 */
async function handleSubmit() {
  errorMsg.value = ''

  // 校验长度
  if (newPassword.value.length < 6) {
    errorMsg.value = '新密码长度至少为6位'
    return
  }

  // 校验两次输入一致
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的新密码不一致'
    return
  }

  // 校验新旧密码不同
  if (oldPassword.value === newPassword.value) {
    errorMsg.value = '新密码不能与旧密码相同'
    return
  }

  submitting.value = true
  try {
    await systemAuthChangePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    toast.success('密码修改成功')
    router.back()
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '修改失败'
    errorMsg.value = msg
  } finally {
    submitting.value = false
  }
}
</script>
