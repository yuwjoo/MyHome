import { ref } from 'vue'
import { toast } from 'vue-sonner'
import type { FileItem } from '@/types'
import { downloadCloudFile, downloadCloudFiles } from '@/utils/download'

/**
 * Manages file action sheet target, download counter,
 * and provides file-action event handlers.
 */
export function useFileActions() {
  const fileActionTarget = ref<FileItem | null>(null)
  const downloadCount = ref(0)

  // ── Action sheet ──────────────────────────────────────────────────────────
  function openFileAction(file: FileItem) {
    fileActionTarget.value = file
  }

  function closeFileAction() {
    fileActionTarget.value = null
  }

  // ── Individual file actions ───────────────────────────────────────────────
  async function doDownload(file: FileItem) {
    const ok = await downloadCloudFile(file.path, file.name)
    if (ok) {
      downloadCount.value++
    }
  }

  /** 批量下载：逐个触发，全部完成后上报进度 */
  async function doBulkDownload(files: FileItem[]) {
    toast.info(`正在添加 ${files.length} 个下载任务...`)

    const { success, failed } = await downloadCloudFiles(
      files.map((f) => ({ path: f.path, name: f.name })),
    )

    downloadCount.value += success

    if (failed > 0) {
      toast.error(`${success} 个成功，${failed} 个失败`)
    } else {
      toast.success(`已添加 ${success} 个下载任务`)
    }
  }

  return {
    fileActionTarget,
    downloadCount,
    openFileAction,
    closeFileAction,
    doDownload,
    doBulkDownload,
  }
}
