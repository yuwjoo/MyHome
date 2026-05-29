<template>
  <div
    data-cmp="UserDetailView"
    class="min-h-screen bg-background flex flex-col max-w-md mx-auto overflow-x-hidden"
  >
    <div class="flex items-center gap-3 px-5 pt-10 pb-4">
      <button
        @click="router.push('/profile')"
        class="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-custom active:opacity-60 transition-opacity"
      >
        <ChevronLeftIcon :size="20" class="text-foreground" :stroke-width="2.5" />
      </button>
      <span class="text-base font-bold text-foreground">个人资料</span>
    </div>

    <div class="flex flex-col items-center pt-6 pb-8">
      <button
        class="relative group active:scale-95 transition-transform"
        :disabled="avatarUploading"
        @click="showAvatarSheet = true"
      >
        <!-- 头像主体 -->
        <div
          class="w-24 h-24 rounded-3xl border-2 border-primary/20 flex items-center justify-center shadow-custom overflow-hidden"
          :class="avatarUrl ? 'bg-card' : 'bg-primary/10'"
        >
          <img v-if="avatarUrl" :src="avatarUrl" alt="头像" class="w-full h-full object-cover" />
          <span v-else class="text-4xl font-bold text-primary">{{ user.name.slice(0, 1) }}</span>
        </div>
        <!-- 上传中遮罩 -->
        <div
          v-if="avatarUploading"
          class="absolute inset-0 w-24 h-24 rounded-3xl bg-black/50 flex items-center justify-center"
        >
          <div
            class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
          />
        </div>
        <!-- 相机图标 -->
        <div
          v-if="!avatarUploading"
          class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-custom"
        >
          <CameraIcon :size="14" class="text-white" :stroke-width="2.5" />
        </div>
      </button>
      <div class="mt-4 text-foreground text-lg font-bold">{{ user.name }}</div>
      <div class="mt-1.5 text-xs px-3 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
        {{ authStore.userInfo.level }}
      </div>
    </div>

    <div class="px-5 mb-6">
      <div class="bg-card rounded-3xl border border-border shadow-custom overflow-hidden">
        <button
          v-for="(row, idx) in INFO_ROWS"
          :key="row.key!"
          class="w-full flex items-center gap-4 px-5 py-4.5 active:bg-muted transition-colors"
          :class="{ 'border-b border-border': idx < INFO_ROWS.length - 1 }"
          @click="openEdit(row.key)"
        >
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            :class="row.bg"
          >
            <component :is="row.icon" :size="18" :class="row.color" :stroke-width="2" />
          </div>
          <div class="flex-1 min-w-0 text-left">
            <div class="text-xs text-muted-foreground mb-0.5">{{ row.label }}</div>
            <div class="text-sm font-semibold text-foreground truncate">{{ user[row.key!] }}</div>
          </div>
          <EditIcon :size="14" class="text-muted-foreground flex-shrink-0" :stroke-width="2" />
        </button>
      </div>
    </div>

    <div class="px-5 mb-10">
      <div class="text-xs font-semibold text-muted-foreground mb-3 px-1">账号安全</div>
      <div class="bg-card rounded-3xl border border-border shadow-custom overflow-hidden">
        <button
          @click="router.push('/change-password')"
          class="w-full flex items-center gap-4 px-5 py-4.5 border-b border-border active:bg-muted transition-colors"
        >
          <div
            class="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0"
          >
            <ShieldIcon :size="18" class="text-rose-500" :stroke-width="2" />
          </div>
          <span class="flex-1 text-left text-sm font-semibold text-foreground">修改密码</span>
          <ChevronRightIcon :size="15" class="text-muted-foreground" :stroke-width="2" />
        </button>
        <button
          @click="toast.info('账号注销')"
          class="w-full flex items-center gap-4 px-5 py-4.5 active:bg-muted transition-colors"
        >
          <div
            class="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0"
          >
            <UserIcon :size="18" class="text-muted-foreground" :stroke-width="2" />
          </div>
          <span class="flex-1 text-left text-sm font-semibold text-foreground">账号注销</span>
          <ChevronRightIcon :size="15" class="text-muted-foreground" :stroke-width="2" />
        </button>
      </div>
    </div>

    <!-- Avatar Sheet -->
    <div
      class="fixed inset-0 z-50 flex items-end justify-center transition-all duration-200"
      :class="showSheet ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
    >
      <div class="absolute inset-0 bg-black/40" @click="showAvatarSheet = false" />
      <div
        class="relative w-full max-w-md bg-card rounded-t-3xl px-5 pt-5 pb-12 shadow-custom transition-transform duration-300"
        :class="showSheet ? 'translate-y-0' : 'translate-y-full'"
      >
        <div class="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
        <div class="text-base font-bold text-foreground mb-6 text-center">更换头像</div>
        <div class="flex gap-4 mb-5">
          <button
            @click="((showAvatarSheet = false), handleAvatarPick())"
            class="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl bg-muted active:bg-border transition-colors border border-border"
          >
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon :size="22" class="text-primary" :stroke-width="2" />
            </div>
            <span class="text-sm font-semibold text-foreground">本地相册</span>
          </button>
          <button
            @click="((showAvatarSheet = false), handleAvatarPick())"
            class="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl bg-muted active:bg-border transition-colors border border-border"
          >
            <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
              <CameraIcon :size="22" class="text-amber-500" :stroke-width="2" />
            </div>
            <span class="text-sm font-semibold text-foreground">本地文件</span>
          </button>
        </div>
        <button
          @click="showAvatarSheet = false"
          class="w-full py-4 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm active:bg-border transition-colors"
        >
          取消
        </button>
      </div>
    </div>

    <!-- Edit Field Sheet -->
    <div
      class="fixed inset-0 z-50 flex items-end justify-center transition-all duration-200"
      :class="showModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
    >
      <div class="absolute inset-0 bg-black/40" @click="editField = null" />
      <div
        class="relative w-full max-w-md bg-card rounded-t-3xl px-6 pt-5 pb-10 shadow-custom transition-transform duration-300"
        :class="showModal ? 'translate-y-0' : 'translate-y-full'"
      >
        <div class="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
        <div class="text-base font-bold text-foreground mb-5">
          修改{{ editField ? FIELD_LABELS[editField] : '' }}
        </div>

        <!-- 性别 → 滑动选择器 -->
        <div
          v-if="editField === 'gender'"
          class="flex flex-col gap-3 max-h-60 overflow-y-auto"
        >
          <button
            v-for="opt in genderOptions"
            :key="opt"
            class="w-full py-4 rounded-2xl text-sm font-semibold border transition-colors"
            :class="editValue === opt
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted text-foreground border-border active:bg-border'"
            @click="editValue = opt"
          >
            {{ opt }}
          </button>
        </div>

        <!-- 其他字段 → 文本输入 -->
        <input
          v-else
          v-model="editValue"
          class="w-full bg-muted rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
          :placeholder="`请输入${editField ? FIELD_LABELS[editField] : ''}`"
          maxlength="30"
        />
        <div class="flex gap-3 mt-5">
          <button
            @click="editField = null"
            class="flex-1 py-4 rounded-2xl bg-muted text-foreground font-semibold text-sm"
          >
            取消
          </button>
          <button
            @click="saveEdit"
            class="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import {
  ChevronLeftIcon,
  EditIcon,
  CameraIcon,
  ImageIcon,
  PhoneIcon,
  UserIcon,
  MailIcon,
  ShieldIcon,
  ChevronRightIcon,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { systemAuthUpdateUserInfo } from '@/api/modules/auth'
import { uploadToOss } from '@/utils/oss/uploadFile'
import { API_BASE_URL } from '@/utils/config'

const router = useRouter()
const authStore = useAuthStore()

/** 本地可编辑的用户字段（从 authStore 初始化） */
const localUser = ref({
  name: authStore.userInfo.name,
  phone: authStore.userInfo.phone,
  email: authStore.userInfo.email,
  gender: authStore.userInfo.gender || '男',
})

/** 同步给视图用的用户信息 */
const user = computed(() => ({
  name: localUser.value.name,
  phone: localUser.value.phone,
  email: localUser.value.email,
  gender: localUser.value.gender,
  avatar: authStore.userInfo.avatar,
}))

/** 头像缩略图 URL（公开接口，无需认证） */
const avatarUrl = computed(() => {
  const refId = authStore.userInfo.avatar
  if (!refId) return ''
  return `${API_BASE_URL}/oss/getPublicFileThumbnail?ossObjectRefId=${encodeURIComponent(refId)}&imageWidth=256`
})

type EditField = 'name' | 'phone' | 'email' | 'gender' | null

const FIELD_LABELS: Record<string, string> = {
  name: '用户名称',
  phone: '手机号码',
  email: '邮箱地址',
  gender: '性别',
}

const INFO_ROWS = [
  {
    key: 'name' as EditField,
    icon: UserIcon,
    label: '用户名称',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    key: 'phone' as EditField,
    icon: PhoneIcon,
    label: '手机号码',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    key: 'email' as EditField,
    icon: MailIcon,
    label: '邮箱地址',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    key: 'gender' as EditField,
    icon: ShieldIcon,
    label: '性别',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
]

const showAvatarSheet = ref(false)
const editField = ref<EditField>(null)
const editValue = ref('')
const avatarUploading = ref(false)

/** 性别选项 */
const genderOptions = ['男', '女']

const showModal = computed(() => editField.value !== null)
const showSheet = showAvatarSheet

function openEdit(field: EditField) {
  if (!field) return
  editValue.value = user.value[field]
  editField.value = field
}

/** 保存编辑（昵称调用后端接口，其他字段本地更新） */
async function saveEdit() {
  if (!editField.value || !editValue.value.trim()) return
  const field = editField.value
  const newValue = editValue.value.trim()
  try {
    // 昵称变更走后端接口
    if (field === 'name') {
      await systemAuthUpdateUserInfo({ userName: newValue })
      authStore.updateUserInfo({ name: newValue })
    }
    // 更新本地状态
    ;(localUser.value as any)[field] = newValue
    toast.success(`${FIELD_LABELS[field]}已更新`)
  } catch {
    toast.error(`${FIELD_LABELS[field]}更新失败`)
  }
  editField.value = null
}

/** 选择头像并上传 */
async function handleAvatarPick() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    showAvatarSheet.value = false
    avatarUploading.value = true

    try {
      const ossObjectRefId = await uploadToOss(file)

      // 更新用户头像（后端内部调用 ossService.useFile 标记为 public）
      await systemAuthUpdateUserInfo({ avatarUrl: ossObjectRefId })
      authStore.updateUserInfo({ avatar: ossObjectRefId })

      toast.success('头像已更新')
    } catch {
      toast.error('头像上传失败')
    } finally {
      avatarUploading.value = false
    }
  }
  input.click()
}
</script>
