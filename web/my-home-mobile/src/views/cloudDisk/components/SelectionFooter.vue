<!--
  选择模式底部操作栏组件
  多选模式下显示批量操作按钮
-->
<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
    :class="rendered ? animClass : 'opacity-0 pointer-events-none'"
    style="box-shadow: 0 -4px 24px rgba(91,93,232,0.10)"
  >
    <div class="flex items-center justify-around px-2 pt-3 pb-safe">
      <button
        v-for="action in actions"
        :key="action.label"
        @click="(action.label === '重命名' && disabledRename) ? undefined : action.handler()"
        class="flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-colors"
        :class="{
          'opacity-30 cursor-not-allowed': action.label === '重命名' && disabledRename,
          'text-destructive active:bg-destructive/10': action.danger && !(action.label === '重命名' && disabledRename),
          'text-foreground active:bg-muted': !action.danger && !(action.label === '重命名' && disabledRename),
        }"
      >
        <component :is="action.icon" :size="20" :stroke-width="1.8" />
        <span class="text-xs font-medium">{{ action.label }}</span>
      </button>
    </div>
    <div class="h-5 bg-card" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Trash2Icon, PencilIcon, InfoIcon, FolderInputIcon, DownloadIcon } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  /** 是否显示底部操作栏 */
  visible?: boolean
  /** 当前选中的文件数量 */
  selectedCount?: number
}>(), {
  visible: false,
  selectedCount: 0,
})

const emit = defineEmits<{
  /** 触发批量删除 */
  delete: []
  /** 触发批量重命名 */
  rename: []
  /** 触发查看文件详情 */
  info: []
  /** 触发批量移动 */
  move: []
  /** 触发批量下载 */
  download: []
}>()

const animClass = ref('')
const rendered = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => props.visible, (val) => {
  if (val) {
    rendered.value = true
    nextTick(() => { animClass.value = 'action-footer-enter' })
  } else {
    animClass.value = 'action-footer-leave'
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { rendered.value = false }, 240)
  }
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

const actions = [
  { icon: DownloadIcon, label: '下载', handler: () => emit('download') },
  { icon: FolderInputIcon, label: '移动', handler: () => emit('move') },
  { icon: PencilIcon, label: '重命名', handler: () => emit('rename') },
  { icon: InfoIcon, label: '详情', handler: () => emit('info') },
  { icon: Trash2Icon, label: '删除', handler: () => emit('delete'), danger: true },
]

const disabledRename = props.selectedCount > 1
</script>
