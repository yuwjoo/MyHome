import { ref } from 'vue'

/**
 * 对话框状态管理
 * 统一管理删除确认弹窗和重命名弹窗的可见性与初始数据
 */
export function useDialogs() {
  /** 删除弹窗状态 */
  const deleteDialog = ref<{
    visible: boolean
    label: string
    path?: string
    paths?: string[]
  }>({ visible: false, label: '' })

  /** 重命名弹窗状态 */
  const renameDialog = ref<{
    visible: boolean
    initialName: string
    path?: string
  }>({ visible: false, initialName: '' })

  // ── 删除弹窗操作 ──
  function openDeleteDialog(label: string, path?: string, paths?: string[]) {
    deleteDialog.value = { visible: true, label, path, paths }
  }

  function closeDeleteDialog() {
    deleteDialog.value = { visible: false, label: '' }
  }

  // ── 重命名弹窗操作 ──
  function openRenameDialog(initialName: string, path?: string) {
    renameDialog.value = { visible: true, initialName, path }
  }

  function closeRenameDialog() {
    renameDialog.value = { visible: false, initialName: '' }
  }

  return {
    deleteDialog,
    renameDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openRenameDialog,
    closeRenameDialog,
  }
}
