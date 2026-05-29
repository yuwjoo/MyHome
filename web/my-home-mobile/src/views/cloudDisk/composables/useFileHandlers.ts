import type { Router } from 'vue-router'
import type { FileItem } from '@/types'
import type { useFileNavigation } from './useFileNavigation'
import type { useSelection } from './useSelection'
import type { useFileActions } from './useFileActions'
import type { useDialogs } from './useDialogs'
import type { useTypeFilter } from './useTypeFilter'

/** 各组合式函数实例的类型 */
interface HandlerDeps {
  router: Router
  navigation: ReturnType<typeof useFileNavigation>
  selection: ReturnType<typeof useSelection>
  fileActions: ReturnType<typeof useFileActions>
  dialogs: ReturnType<typeof useDialogs>
  typeFilter: ReturnType<typeof useTypeFilter>
  /** 刷新当前路径的文件列表 */
  refreshFileList: () => Promise<void>
}

/**
 * 文件操作事件处理器
 * 将分散在父组件中的导航、单文件操作、批量操作等事件逻辑统一收拢
 * 所有写入操作均调用真实后端 API，完成后自动刷新列表
 */
export function useFileHandlers(deps: HandlerDeps) {
  const { router, navigation, selection, fileActions, dialogs, typeFilter, refreshFileList } = deps

  // ==========================================================
  // 文件导航
  // ==========================================================

  /** 打开文件夹 */
  function openFolder(file: FileItem) {
    navigation.navigateToFolder(file.name, file.path)
    selection.cancelSelection()
    typeFilter.resetFilter()
  }

  /** 打开文件详情（传递 path 以便详情页可从 API 获取） */
  function openFile(file: FileItem) {
    router.push({ path: '/file-detail', state: { ...file } })
  }

  /** 面包屑导航 */
  function handleNavigateBreadcrumb(path: string) {
    navigation.navigateBreadcrumb(path)
    selection.cancelSelection()
    typeFilter.resetFilter()
  }

  // ==========================================================
  // 单个文件操作（来自 FileActionSheet 的点击事件）
  // ==========================================================

  function handleFileActionShown(file: FileItem) {
    fileActions.openFileAction(file)
  }

  function handleSingleDelete(file: FileItem) {
    fileActions.closeFileAction()
    dialogs.openDeleteDialog(file.name, file.path)
  }

  function handleSingleRename(file: FileItem) {
    fileActions.closeFileAction()
    dialogs.openRenameDialog(file.name, file.path)
  }

  function handleSingleInfo(file: FileItem) {
    fileActions.closeFileAction()
    router.push({ path: '/file-detail', state: { ...file } })
  }

  function handleSingleMove(file: FileItem) {
    fileActions.closeFileAction()
    router.push({ path: '/move-file', state: { name: file.name, path: file.path } as any })
  }

  function handleSingleDownload(file: FileItem) {
    fileActions.doDownload(file)
  }

  // ==========================================================
  // 批量操作（来自 SelectionFooter 的点击事件）
  // ==========================================================

  function handleBulkDelete() {
    const selected = selection.selectedFiles.value
    const paths = selected.map((f) => f.path)
    const count = selected.length
    dialogs.openDeleteDialog(`${count} 个文件`, undefined, paths)
  }

  function handleBulkRename() {
    const f = selection.selectedFiles.value[0]
    if (f) dialogs.openRenameDialog(f.name, f.path)
  }

  function handleBulkInfo() {
    const f = selection.selectedFiles.value[0]
    if (f) router.push({ path: '/file-detail', state: { ...f } })
  }

  function handleBulkMove() {
    const selected = selection.selectedFiles.value
    const names = selected.map((f) => f.name)
    const paths = selected.map((f) => f.path)
    router.push({ path: '/move-file', state: { names, paths, name: names[0], path: paths[0] } as any })
  }

  async function handleBulkDownload() {
    await fileActions.doBulkDownload(selection.selectedFiles.value)
    selection.cancelSelection()
  }

  // ==========================================================
  // 弹窗确认回调
  // ==========================================================

  /** 删除确认：调 API 后清除选中 & 关闭弹窗 & 刷新列表 */
  async function onDeleteConfirmed() {
    selection.cancelSelection()
    dialogs.closeDeleteDialog()
    await refreshFileList()
  }

  /** 重命名确认：关闭弹窗 & 刷新列表 */
  async function onRenameConfirmed() {
    dialogs.closeRenameDialog()
    await refreshFileList()
  }

  return {
    // 导航
    openFolder,
    openFile,
    handleNavigateBreadcrumb,
    // 单个文件操作
    handleFileActionShown,
    handleSingleDelete,
    handleSingleRename,
    handleSingleInfo,
    handleSingleMove,
    handleSingleDownload,
    // 批量操作
    handleBulkDelete,
    handleBulkRename,
    handleBulkInfo,
    handleBulkMove,
    handleBulkDownload,
    // 弹窗确认
    onDeleteConfirmed,
    onRenameConfirmed,
  }
}
