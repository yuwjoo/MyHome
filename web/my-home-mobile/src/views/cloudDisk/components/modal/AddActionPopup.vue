<!--
  新建操作面板组件
  支持上传文件和新建文件夹
-->
<template>
  <div class="fixed inset-0 z-50" :class="{ 'pointer-events-none': !rendered }">
    <!-- 遮罩层 -->
    <div
      class="absolute inset-0 transition-opacity duration-200"
      :class="rendered ? 'opacity-100' : 'opacity-0'"
      style="background: rgba(18,22,42,0.45)"
      @click="uploading ? undefined : emit('close')"
      @touchmove.prevent
    />

    <!-- 隐藏文件选择器 -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      @change="onFileSelected"
    />

    <!-- 底部面板 -->
    <div
      class="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl pb-10 pt-5 px-5 shadow-custom"
      :class="rendered ? animClass : 'translate-y-full'"
    >
      <div class="flex justify-center mb-5">
        <div class="w-10 h-1 rounded-full bg-border" />
      </div>

      <div class="flex items-center justify-between mb-6">
        <span class="text-base font-bold text-foreground">
          {{ uploading ? '正在上传' : '添加内容' }}
        </span>
        <button
          @click="uploading ? undefined : emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-border transition-colors"
          :class="{ 'opacity-40 pointer-events-none': uploading }"
        >
          <XIcon :size="16" class="text-muted-foreground" :stroke-width="2.5" />
        </button>
      </div>

      <!-- 上传进度区域 -->
      <template v-if="uploading">
        <div class="flex flex-col gap-4 mb-4">
          <div class="text-sm text-muted-foreground text-center py-6">
            文件「{{ uploadFileName }}」已添加到传输列表
          </div>
        </div>
      </template>

      <!-- 操作按钮区域 -->
      <template v-else>
        <div class="flex gap-4">
          <!-- 上传文件 -->
          <button
            @click="handleUploadFile"
            class="flex-1 flex flex-col items-center gap-3 py-6 rounded-2xl bg-secondary/60 border border-primary/15 active:bg-secondary transition-colors"
          >
            <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-custom">
              <UploadIcon :size="22" class="text-primary-foreground" :stroke-width="2" />
            </div>
            <span class="text-sm font-semibold text-foreground">上传文件</span>
            <span class="text-xs text-muted-foreground">从本地选择文件</span>
          </button>

          <!-- 新建文件夹 -->
          <button
            @click="folderDialogOpen = true"
            class="flex-1 flex flex-col items-center gap-3 py-6 rounded-2xl bg-purple-50 border border-purple-100 active:bg-purple-100/80 transition-colors"
          >
            <div class="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-custom">
              <FolderPlusIcon :size="22" class="text-white" :stroke-width="2" />
            </div>
            <span class="text-sm font-semibold text-foreground">新建文件夹</span>
            <span class="text-xs text-muted-foreground">创建空文件夹</span>
          </button>
        </div>
      </template>
    </div>

    <!-- 新建文件夹弹窗 -->
    <div
      v-if="folderDialogOpen"
      class="absolute inset-0 z-10 flex items-center justify-center px-6"
    >
      <div class="absolute inset-0 bg-black/30" @click="folderDialogOpen = false" />
      <div class="relative w-full bg-card rounded-2xl shadow-custom px-5 py-6 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <span class="text-base font-bold text-foreground">新建文件夹</span>
          <button
            @click="folderDialogOpen = false"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-border transition-colors"
          >
            <XIcon :size="16" class="text-muted-foreground" :stroke-width="2.5" />
          </button>
        </div>
        <input
          ref="inputRef"
          v-model="folderName"
          type="text"
          placeholder="请输入文件夹名称"
          class="w-full h-11 rounded-xl border border-border bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-400 transition-colors"
          @keydown.enter="handleCreateFolder"
        />
        <div class="flex gap-3">
          <button
            @click="folderDialogOpen = false"
            class="flex-1 h-11 rounded-xl bg-muted text-sm font-semibold text-muted-foreground active:bg-border transition-colors"
          >
            取消
          </button>
          <button
            @click="handleCreateFolder"
            :disabled="!folderName.trim()"
            class="flex-1 h-11 rounded-xl bg-purple-500 text-sm font-semibold text-white active:bg-purple-600 disabled:opacity-40 transition-colors"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { UploadIcon, FolderPlusIcon, XIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { createFolder } from '../../data'
import { cloudDiskCreate } from '@/api'
import {
  useFileTransferStore,
  TransferTaskStatus,
  TransferType,
} from '@/modules/fileTransfer'

const props = withDefaults(defineProps<{
  /** 是否显示新建面板 */
  visible?: boolean
  /** 当前所在目录路径 */
  parentPath?: string
}>(), {
  visible: false,
  parentPath: '/',
})

const emit = defineEmits<{
  /** 关闭新建面板 */
  close: []
  /** 文件或文件夹创建成功 */
  created: []
}>()

const store = useFileTransferStore()

// ── 面板动画 ──
const animClass = ref('')
const rendered = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => props.visible, (val) => {
  if (val) {
    rendered.value = true
    document.body.style.overflow = 'hidden'
    nextTick(() => { animClass.value = 'add-sheet-enter' })
  } else {
    animClass.value = 'add-sheet-leave'
    document.body.style.overflow = ''
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { rendered.value = false }, 240)
  }
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

// ── 新建文件夹弹窗 ──
const folderDialogOpen = ref(false)
const folderName = ref('')
const creating = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

watch(folderDialogOpen, (val) => {
  if (val) {
    folderName.value = ''
    setTimeout(() => inputRef.value?.focus(), 50)
  }
})

// ── 文件上传（通过 fileTransfer 模块） ──
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadFileName = ref('')

function handleUploadFile() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const destPath =
    props.parentPath === '/'
      ? `/${file.name}`
      : `${props.parentPath}/${file.name}`

  const task = store.createTask({
    taskName: file.name,
    taskIcon: 'upload',
    transferType: TransferType.UPLOAD,
    totalSize: file.size,
    payload: { file, destPath },
  })

  uploadFileName.value = file.name
  uploading.value = true

  // 监听任务完成，调用业务 API 注册文件
  const unwatch = watch(
    () => task.taskStatus,
    async (status) => {
      if (status === TransferTaskStatus.SUCCESS) {
        const ossObjectRefId = task.payload.ossObjectRefId as string
        try {
          await cloudDiskCreate({
            path: destPath,
            type: 'file',
            ossObjectRefId,
          })
          toast.success(`文件「${file.name}」上传成功`)
          emit('created')
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '文件注册失败'
          toast.error(msg)
        }
        unwatch()
        resetUpload()
      } else if (
        status === TransferTaskStatus.FAILED ||
        status === TransferTaskStatus.CANCELED
      ) {
        const msg = task.errorMessage || '上传失败'
        toast.error(msg)
        unwatch()
        resetUpload()
      }
    }
  )

  // 任务已入队，关闭弹窗让用户去 TransferView 查看
  setTimeout(() => {
    emit('close')
  }, 600)

  input.value = ''
}

function resetUpload() {
  uploading.value = false
  uploadFileName.value = ''
}

// ── 新建文件夹 ──
async function handleCreateFolder() {
  const trimmed = folderName.value.trim()
  if (!trimmed || creating.value) return
  creating.value = true
  try {
    await createFolder(trimmed, props.parentPath)
    folderDialogOpen.value = false
    toast.success(`文件夹「${trimmed}」已创建`)
    emit('created')
    emit('close')
  } catch {
    // 错误已在拦截器中通过 toast 提示
  } finally {
    creating.value = false
  }
}
</script>
