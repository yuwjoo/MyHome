<!--
  文件操作面板组件
  展示文件操作菜单（下载、移动、重命名、详情、删除）
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import { Trash2Icon, PencilIcon, InfoIcon, FolderInputIcon, DownloadIcon, XIcon } from 'lucide-vue-next'
import type { FileItem } from '@/types'
import FileItemIcon from './FileItemIcon.vue'

const props = withDefaults(defineProps<{
  /** 是否显示操作面板 */
  visible?: boolean
  /** 当前操作的文件对象 */
  file?: FileItem | null
}>(), {
  visible: false,
  file: null,
})

const emit = defineEmits<{
  /** 关闭操作面板 */
  close: []
  /** 删除文件 */
  delete: [file: FileItem]
  /** 重命名文件 */
  rename: [file: FileItem]
  /** 查看文件详情 */
  info: [file: FileItem]
  /** 移动文件 */
  move: [file: FileItem]
  /** 下载文件 */
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

const actions = computed(() => props.file ? [
  { icon: DownloadIcon, label: '下载', handler: () => { emit('download', props.file!); emit('close') } },
  { icon: FolderInputIcon, label: '移动', handler: () => { emit('move', props.file!); emit('close') } },
  { icon: PencilIcon, label: '重命名', handler: () => { emit('rename', props.file!); emit('close') } },
  { icon: InfoIcon, label: '详情', handler: () => { emit('info', props.file!); emit('close') } },
  { icon: Trash2Icon, label: '删除', handler: () => { emit('delete', props.file!); emit('close') }, danger: true },
] : [])
</script>
