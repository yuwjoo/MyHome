/**
 * src/views/profile/composables/useProfile.ts
 * 个人信息页状态管理 —— 从 authStore 读取当前登录用户信息
 */
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { systemAuthUpdateUserInfo } from '@/api/modules/auth'

export function useProfile() {
  const authStore = useAuthStore()

  /** 当前登录用户（从 store 读取，登录后自动填充） */
  const user = computed(() => authStore.userInfo)

  const showLogout = ref(false)
  const showEditName = ref(false)
  const editName = ref('')

  /** 打开修改昵称面板 */
  function openEditName() {
    editName.value = user.value.name
    showEditName.value = true
  }

  /** 保存新昵称（调用后端接口） */
  async function saveName() {
    if (!editName.value.trim()) return
    const newName = editName.value.trim()
    try {
      await systemAuthUpdateUserInfo({ userName: newName })
      authStore.updateUserInfo({ name: newName })
      toast.success('昵称已更新')
    } catch {
      toast.error('昵称更新失败')
    }
    showEditName.value = false
  }

  /** 确认退出登录 */
  function handleLogout() {
    toast.success('已退出登录')
    setTimeout(() => {
      authStore.logout()
    }, 800)
    showLogout.value = false
  }

  return {
    user, editName,
    showLogout, showEditName,
    openEditName, saveName, handleLogout,
  }
}
