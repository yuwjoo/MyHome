<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeftIcon, FolderIcon } from 'lucide-vue-next'
import { loadFolderChildren, moveFile } from './data'
import type { FolderNode } from './data'
import FolderTreeNode from './components/FolderTreeNode.vue'

interface MoveFileState {
  name?: string
  names?: string[]
  path?: string
  paths?: string[]
}

const router = useRouter()
const state = (history.state as MoveFileState) ?? {}
const fileName = state.names
  ? `${state.names.length} 个文件`
  : (state.name ?? '文件')
const filePaths: string[] = state.paths ?? (state.path ? [state.path] : [])

const selectedPath = ref('/')
const selectedName = ref('全部文件')
const folderTree = ref<FolderNode[]>([])
const treeLoading = ref(false)
const moving = ref(false)

/** 初始化：加载根目录文件夹树 */
onMounted(async () => {
  treeLoading.value = true
  try {
    folderTree.value = await loadFolderChildren('/')
  } catch {
    toast.error('加载文件夹失败')
  } finally {
    treeLoading.value = false
  }
})

/** 选中目标文件夹 */
function handleSelect(path: string, name: string) {
  selectedPath.value = path
  selectedName.value = name
}

/** 展开文件夹节点时懒加载子文件夹 */
async function handleExpand(node: FolderNode) {
  if (node.children !== undefined) return // 已加载
  try {
    node.children = await loadFolderChildren(node.path)
  } catch {
    // 静默失败
  }
}

/** 确认移动 */
async function handleConfirm() {
  if (moving.value || filePaths.length === 0) return
  const targetPath = selectedPath.value
  // 不允许移动到自身目录
  if (filePaths.some((p) => p === targetPath)) {
    toast.error('不能移动到自身目录')
    return
  }
  moving.value = true
  try {
    await Promise.all(filePaths.map((p) => moveFile(p, targetPath)))
    toast.success(`已将 ${fileName} 移动到 ${selectedName.value}`)
    router.back()
  } catch {
    // 错误已在拦截器中通过 toast 提示
  } finally {
    moving.value = false
  }
}
</script>

<template>
  <div data-cmp="MoveFileView" class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-0">
    <header class="flex items-center justify-between px-5 pt-10 pb-4">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors"
      >
        <ArrowLeftIcon :size="18" class="text-foreground" :stroke-width="2.2" />
      </button>
      <div class="flex-1 text-center">
        <div class="text-base font-bold text-foreground">移动文件</div>
        <div class="text-xs text-muted-foreground mt-0.5 truncate px-4">{{ fileName }}</div>
      </div>
      <div class="w-10" />
    </header>

    <div class="mx-5 mb-4 px-4 py-3 bg-primary/8 rounded-2xl border border-primary/15 flex items-center gap-2">
      <FolderIcon :size="14" class="text-primary flex-shrink-0" :stroke-width="2" />
      <span class="text-xs text-primary font-medium">移动到：</span>
      <span class="text-xs text-primary font-semibold truncate">{{ selectedName }}</span>
    </div>

    <div class="flex-1 px-4 overflow-y-auto pb-36">
      <!-- 加载状态 -->
      <div v-if="treeLoading" class="flex items-center justify-center py-20">
        <span class="text-sm text-muted-foreground">加载文件夹...</span>
      </div>

      <!-- 文件夹树 -->
      <div v-else class="bg-card rounded-2xl border border-border shadow-custom px-2 py-2">
        <FolderTreeNode
          v-for="node in folderTree"
          :key="node.id"
          :node="node"
          :depth="0"
          :selected-path="selectedPath"
          @select="handleSelect"
          @expand="handleExpand"
        />
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-5 pt-4 pb-8 flex gap-3 max-w-md mx-auto">
      <button
        @click="router.back()"
        class="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-semibold text-sm active:opacity-80 transition-opacity border border-border"
      >
        取消
      </button>
      <button
        @click="handleConfirm"
        :disabled="moving"
        class="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:opacity-80 transition-opacity shadow-custom disabled:opacity-50"
      >
        {{ moving ? '移动中...' : '移动到此处' }}
      </button>
    </div>
  </div>
</template>
