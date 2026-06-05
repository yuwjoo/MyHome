<!--
  文件宫格项组件
  宫格模式下的卡片式文件条目
-->
<template>
  <div
    class="relative flex flex-col rounded-2xl transition-all file-item-appear shadow-custom overflow-hidden"
    :class="selected ? 'bg-secondary border border-primary/25' : 'bg-card border border-transparent'"
    style="width: calc(33.333% - 7px)"
    :style="{ animationDelay: `${index * 0.035}s` }"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="flex items-center justify-center pt-4 pb-2.5">
      <FileItemIcon :type="file.type" :size="26" :file-path="file.type === 'image' ? file.path : undefined" />
    </div>

    <div class="px-2 pb-3">
      <div class="text-xs font-semibold text-foreground text-center truncate leading-snug">{{ file.name }}</div>
    </div>

    <div v-if="isSelecting" class="absolute top-2 right-2">
      <input
        type="checkbox"
        class="file-checkbox"
        :checked="selected"
        @change="emit('toggleSelect', file.id)"
        @click.stop
      />
    </div>
    <button
      v-else-if="file.type !== 'folder'"
      class="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-lg bg-transparent active:bg-black/10 transition-colors"
      @click.stop="emit('fileAction', file)"
    >
      <MoreHorizontalIcon :size="13" class="text-foreground/60" :stroke-width="2.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { MoreHorizontalIcon } from 'lucide-vue-next'
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
</script>
