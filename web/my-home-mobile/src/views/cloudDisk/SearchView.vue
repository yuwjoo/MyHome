<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeftIcon, SearchIcon, XCircleIcon, MoreHorizontalIcon } from 'lucide-vue-next'
import type { FileItem } from '@/types'
import { fetchFileList, deleteFile, renameFile } from './data'
import { useFileActions } from './composables/useFileActions'
import FileIconDisplay from './components/FileIconDisplay.vue'
import FileActionSheet from './components/FileActionSheet.vue'
import DeleteDialog from './components/DeleteDialog.vue'
import RenameDialog from './components/RenameDialog.vue'

const router = useRouter()
const { fileActionTarget, downloadCount, openFileAction, closeFileAction, doDownload } = useFileActions()

// ─── Search state ──────────────────────────────────────────────────────────────
const query = ref('')
const allFiles = ref<FileItem[]>([])
const searchLoading = ref(false)

/** 加载根目录全部文件作为搜索源 */
async function loadAllFiles() {
  searchLoading.value = true
  try {
    allFiles.value = await fetchFileList('/')
  } catch {
    allFiles.value = []
  } finally {
    searchLoading.value = false
  }
}
loadAllFiles()

const results = computed(() => {
  if (!query.value.trim()) return []
  return allFiles.value.filter((f) =>
    f.name.toLowerCase().includes(query.value.toLowerCase()),
  )
})

const isEmpty = query.value.trim().length > 0 && results.value.length === 0

// ─── Dialog state ──────────────────────────────────────────────────────────────
const deleteDialog = ref<{
  visible: boolean
  label: string
  path?: string
}>({ visible: false, label: '' })
const renameDialog = ref<{
  visible: boolean
  initialName: string
  path?: string
}>({ visible: false, initialName: '' })

// ─── File action handlers ──────────────────────────────────────────────────────
function handleFileActionShown(file: FileItem) {
  openFileAction(file)
}

function handleSingleDelete(file: FileItem) {
  closeFileAction()
  deleteDialog.value = { visible: true, label: file.name, path: file.path }
}

function handleSingleRename(file: FileItem) {
  closeFileAction()
  renameDialog.value = { visible: true, initialName: file.name, path: file.path }
}

function handleSingleInfo(file: FileItem) {
  closeFileAction()
  router.push({ path: '/file-detail', state: { ...file } })
}

function handleSingleMove(file: FileItem) {
  closeFileAction()
  router.push({ path: '/move-file', state: { name: file.name, path: file.path } as any })
}

function handleSingleDownload(file: FileItem) {
  doDownload(file)
}

// ─── Dialog confirm handlers ──────────────────────────────────────────────────
async function onDeleteConfirm() {
  const d = deleteDialog.value
  try {
    if (d.path) {
      await deleteFile(d.path)
    }
    toast.success(`已删除：${d.label}`)
    // 从本地列表中移除
    allFiles.value = allFiles.value.filter((f) => f.path !== d.path)
  } catch {
    toast.error(`删除失败：${d.label}`)
  }
  deleteDialog.value = { visible: false, label: '' }
}

async function onRenameConfirm(newName: string) {
  const r = renameDialog.value
  try {
    if (r.path) {
      const updated = await renameFile(r.path, newName)
      toast.success(`已重命名为：${newName}`)
      // 更新本地列表
      const idx = allFiles.value.findIndex((f) => f.path === r.path)
      if (idx >= 0) {
        allFiles.value[idx] = updated
      }
    }
  } catch {
    // 错误已提示
  }
  renameDialog.value = { visible: false, initialName: '' }
}

function navigateToFileDetail(file: FileItem) {
  router.push({ path: '/file-detail', state: { ...file } })
}

function formatDate(str: string) {
  const d = new Date(str)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
}
</script>

<template>
  <div data-cmp="SearchView" class="min-h-screen bg-background max-w-md mx-auto flex flex-col">

    <!-- Delete Confirm Dialog -->
    <DeleteDialog
      :visible="deleteDialog.visible"
      :label="deleteDialog.label"
      :path="deleteDialog.path"
      @confirm="onDeleteConfirm"
      @cancel="deleteDialog = { visible: false, label: '' }"
    />

    <!-- Rename Dialog -->
    <RenameDialog
      :visible="renameDialog.visible"
      :initial-name="renameDialog.initialName"
      :path="renameDialog.path"
      @confirm="onRenameConfirm"
      @cancel="renameDialog = { visible: false, initialName: '' }"
    />

    <!-- File Action Sheet -->
    <FileActionSheet
      :visible="fileActionTarget !== null"
      :file="fileActionTarget"
      @close="closeFileAction"
      @delete="handleSingleDelete"
      @rename="handleSingleRename"
      @info="handleSingleInfo"
      @move="handleSingleMove"
      @download="handleSingleDownload"
    />

    <header class="sticky top-0 z-20 bg-card border-b border-border">
      <div class="h-safe-top bg-card" />
      <div class="flex items-center gap-3 px-4 h-14">
        <button
          @click="router.push('/')"
          class="w-9 h-9 flex items-center justify-center rounded-full active:bg-muted transition-colors"
        >
          <ArrowLeftIcon :size="20" class="text-foreground" :stroke-width="2.2" />
        </button>
        <div class="flex-1 flex items-center gap-2.5 h-9 px-3.5 rounded-full bg-muted border border-border focus-within:border-primary/50 transition-colors">
          <SearchIcon :size="15" class="text-muted-foreground flex-shrink-0" :stroke-width="2.5" />
          <input
            v-model="query"
            autofocus
            type="text"
            placeholder="搜索文件名..."
            class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            @click="query = ''"
            class="transition-opacity"
            :class="query ? 'opacity-100' : 'opacity-0 pointer-events-none'"
          >
            <XCircleIcon :size="15" class="text-muted-foreground" :stroke-width="2" />
          </button>
        </div>
      </div>
    </header>

    <div class="flex-1">
      <div :class="query.trim() ? 'hidden' : 'flex flex-col items-center justify-center py-24 text-muted-foreground'">
        <div class="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <SearchIcon :size="28" class="text-muted-foreground" :stroke-width="1.5" />
        </div>
        <div class="text-sm font-medium">输入关键词搜索文件</div>
        <div class="text-xs mt-1">支持按文件名搜索</div>
      </div>

      <div :class="isEmpty ? 'flex flex-col items-center justify-center py-24 text-muted-foreground' : 'hidden'">
        <div class="text-3xl mb-3">🔍</div>
        <div class="text-sm font-medium">未找到匹配的文件</div>
        <div class="text-xs mt-1">换个关键词试试</div>
      </div>

      <div v-if="results.length > 0">
        <div class="px-4 py-2.5 border-b border-border">
          <span class="text-xs text-muted-foreground">找到 {{ results.length }} 个结果</span>
        </div>
        <div
          v-for="(file, i) in results"
          :key="file.id"
          class="flex items-center gap-3 px-4 py-3 border-b border-border bg-card active:bg-muted transition-colors file-item-appear"
          :style="{ animationDelay: `${i * 0.04}s` }"
          @click="file.type !== 'folder' && navigateToFileDetail(file)"
        >
          <FileIconDisplay :type="file.type" :size="20" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-foreground truncate">{{ file.name }}</div>
            <div class="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>{{ file.path }}</span>
              <span v-if="file.size">· {{ file.size }}</span>
              <span>· {{ formatDate(file.modifiedAt) }}</span>
            </div>
          </div>
          <div v-if="file.type !== 'folder'" class="flex-shrink-0">
            <button
              class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors"
              @click.stop="handleFileActionShown(file)"
            >
              <MoreHorizontalIcon :size="14" class="text-muted-foreground" :stroke-width="2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
