<!--
  文件操作面板组件
  展示文件操作菜单（下载、移动、重命名、分享、删除）
-->
<template>
  <div v-if="rendered" class="fixed inset-0 z-50" :class="{ 'pointer-events-none': !rendered }">
    <div
      class="absolute inset-0 transition-opacity duration-200"
      :class="rendered ? 'opacity-100' : 'opacity-0'"
      style="background: rgba(18,22,42,0.45)"
      @click="emit('close')"
      @touchmove.prevent
    />
    <div
      class="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl pb-10 pt-5 px-5 shadow-custom"
      :class="rendered ? animClass : 'translate-y-full'"
    >
      <div class="flex justify-center mb-4">
        <div class="w-10 h-1 rounded-full bg-border" />
      </div>

      <div v-if="file" class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3 min-w-0">
          <FileItemIcon :type="file.type" :size="22" :file-path="file.type === 'image' ? file.path : undefined" />
          <div class="min-w-0">
            <div class="text-sm font-bold text-foreground truncate leading-snug">{{ file.name }}</div>
            <div v-if="file.size" class="text-xs text-muted-foreground mt-0.5">{{ file.size }}</div>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-border transition-colors flex-shrink-0 ml-3"
        >
          <XIcon :size="16" class="text-muted-foreground" :stroke-width="2.5" />
        </button>
      </div>

      <div class="flex items-center justify-around">
        <button
          v-for="action in actions"
          :key="action.label"
          @click="action.handler"
          class="flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-colors"
          :class="action.danger
            ? 'text-destructive active:bg-destructive/10'
            : 'text-foreground active:bg-muted'"
        >
          <component :is="action.icon" :size="20" :stroke-width="1.8" />
          <span class="text-xs font-medium">{{ action.label }}</span>
        </button>
      </div>
    </div>

    <!-- 分享弹窗 -->
    <div
      v-if="shareDialogOpen"
      class="absolute inset-0 z-10 flex items-center justify-center px-6"
    >
      <div class="absolute inset-0 bg-black/30" @click="shareDialogOpen = false; emit('close')" />
      <div class="relative w-full max-w-xs bg-card rounded-2xl shadow-custom px-5 py-6 flex flex-col items-center gap-5">
        <div class="flex items-center justify-between w-full">
          <span class="text-base font-bold text-foreground">分享文件</span>
          <button
            @click="shareDialogOpen = false; emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-muted active:bg-border transition-colors"
          >
            <XIcon :size="16" class="text-muted-foreground" :stroke-width="2.5" />
          </button>
        </div>

        <div class="text-sm text-foreground truncate w-full text-center">{{ file?.name }}</div>

        <div class="w-48 h-48 rounded-xl border border-border p-2 bg-white flex items-center justify-center">
          <Loader2Icon
            v-if="shareLinkLoading"
            :size="32"
            class="animate-spin text-muted-foreground"
          />
          <img
            v-else-if="shareQrUrl"
            :src="shareQrUrl"
            :alt="`分享二维码 - ${file?.name}`"
            class="w-full h-full object-contain"
          />
          <span v-else class="text-xs text-muted-foreground">生成失败</span>
        </div>

        <button
          @click="handleCopyShareUrl"
          class="flex items-center gap-2 w-full h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:bg-primary/90 transition-colors justify-center"
        >
          <component :is="copied ? CheckIcon : CopyIcon" :size="16" :stroke-width="2" />
          <span>{{ copied ? '已复制' : '复制分享链接' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Trash2Icon, PencilIcon, Share2Icon, FolderInputIcon, DownloadIcon, XIcon, CopyIcon, CheckIcon, Loader2Icon } from 'lucide-vue-next'
import { toDataURL } from 'qrcode'
import { cloudDiskCreateShareLink } from '@/api'
import type { FileItem } from '@/types'
import FileItemIcon from './FileItemIcon.vue'

const SHARE_EXPIRE_SECONDS = 10 * 60

const props = withDefaults(defineProps<{
  visible?: boolean
  file?: FileItem | null
}>(), {
  visible: false,
  file: null,
})

const emit = defineEmits<{
  close: []
  delete: [file: FileItem]
  rename: [file: FileItem]
  move: [file: FileItem]
  download: [file: FileItem]
}>()

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
  document.body.style.overflow = ''
})

const shareDialogOpen = ref(false)
const shareLinkLoading = ref(false)
const shareUrl = ref('')
const shareQrUrl = ref('')
const copied = ref(false)

const openShareDialog = async () => {
  shareDialogOpen.value = true
  shareLinkLoading.value = true
  shareUrl.value = ''
  shareQrUrl.value = ''
  try {
    const res = await cloudDiskCreateShareLink({
      filePath: props.file!.path,
      expiresIn: SHARE_EXPIRE_SECONDS,
    })
    shareUrl.value = res.data.data
    shareQrUrl.value = await toDataURL(shareUrl.value, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'L',
    })
  } catch {
    shareUrl.value = ''
  } finally {
    shareLinkLoading.value = false
  }
}

const handleCopyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = shareUrl.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const actions = [
  { icon: DownloadIcon, label: '下载', handler: () => { emit('download', props.file!); emit('close') } },
  { icon: FolderInputIcon, label: '移动', handler: () => { emit('move', props.file!); emit('close') } },
  { icon: PencilIcon, label: '重命名', handler: () => { emit('rename', props.file!); emit('close') } },
  { icon: Share2Icon, label: '分享', handler: () => { openShareDialog() } },
  { icon: Trash2Icon, label: '删除', handler: () => { emit('delete', props.file!); emit('close') }, danger: true },
]
</script>
