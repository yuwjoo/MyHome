<!--
  文件列表项组件
  列表模式下的单行文件条目
-->
<template>
  <div
    class="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all file-item-appear shadow-custom"
    :class="selected
      ? 'bg-secondary border border-primary/25'
      : 'bg-card border border-transparent'"
    :style="{ animationDelay: `${index * 0.035}s` }"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <div
      class="transition-all duration-200 overflow-hidden flex-shrink-0"
      :class="isSelecting ? 'w-6 opacity-100' : 'w-0 opacity-0'"
    >
      <input
        type="checkbox"
        class="file-checkbox"
        :checked="selected"
        @change="emit('toggleSelect', file.id)"
        @click.stop
      />
    </div>

    <FileItemIcon :type="file.type" :size="22" :file-path="file.type === 'image' ? file.path : undefined" />

    <div class="flex-1 min-w-0">
      <div class="text-sm font-semibold text-foreground truncate leading-snug">{{ file.name }}</div>
      <div class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
        <span>{{ formatDate(file.modifiedAt) }}</span>
        <template v-if="file.size">
          <span class="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
          <span>{{ file.size }}</span>
        </template>
        <template v-if="file.type === 'folder' && file.childCount !== undefined">
          <span class="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
          <span>{{ file.childCount }} 项</span>
        </template>
      </div>
    </div>

    <div class="flex-shrink-0">
      <div class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted" :class="{ 'hidden': isSelecting }">
        <ChevronRightIcon v-if="file.type === 'folder'" :size="14" class="text-muted-foreground" :stroke-width="2.5" />
        <button
          v-else
          class="w-full h-full flex items-center justify-center"
          @click.stop="emit('fileAction', file)"
        >
          <MoreHorizontalIcon :size="14" class="text-muted-foreground" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment'
import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-vue-next'
import FileItemIcon from '../FileItemIcon.vue'
import type { FileItem } from '@/types'

const props = defineProps<{
  /** 文件数据对象 */
  file: FileItem
  /** 当前项是否被选中 */
  selected: boolean
  /** 是否处于选择模式 */
  isSelecting: boolean
  /** 列表中的索引，用于动画延迟 */
  index: number
}>()

const emit = defineEmits<{
  /** 切换单个文件的选中状态 */
  toggleSelect: [id: string]
  /** 打开文件夹 */
  openFolder: [file: FileItem]
  /** 打开文件 */
  openFile: [file: FileItem]
  /** 触发文件操作菜单 */
  fileAction: [file: FileItem]
}>()

function handleClick() {
  if (props.isSelecting) {
    emit('toggleSelect', props.file.id)
  } else if (props.file.type === 'folder') {
    emit('openFolder', props.file)
  } else {
    emit('openFile', props.file)
  }
}

function handleContextMenu() {
  emit('toggleSelect', props.file.id)
}

function formatDate(str: string) {
  const m = moment(str)
  const now = moment()
  const diffDays = now.diff(m, 'days')
  if (diffDays === 0) return `今天 ${m.format('HH:mm')}`
  if (diffDays === 1) return `昨天 ${m.format('HH:mm')}`
  if (diffDays < 7) return `${diffDays}天前`
  return m.format('YYYY/MM/DD')
}
</script>
