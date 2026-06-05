<!--
  文件视图组件
  通过 type 属性切换列表模式和宫格模式展示文件
-->
<template>
  <template v-if="files.length > 0">
    <!-- 列表模式 -->
    <div v-if="type === 'list'" class="flex flex-col px-4 py-2 gap-2">
      <FileListItem
        v-for="(file, i) in files"
        :key="file.id"
        :file="file"
        :selected="selectedIds.has(file.id)"
        :is-selecting="isSelecting"
        :index="i"
        @toggle-select="(id: string) => emit('toggleSelect', id)"
        @open-folder="(f: FileItem) => emit('openFolder', f)"
        @open-file="(f: FileItem) => emit('openFile', f)"
        @file-action="(f: FileItem) => emit('fileAction', f)"
      />
    </div>

    <!-- 宫格模式 -->
    <div v-else class="px-4 py-2">
      <div class="flex flex-wrap gap-2.5">
        <FileGridItem
          v-for="(file, i) in files"
          :key="file.id"
          :file="file"
          :selected="selectedIds.has(file.id)"
          :is-selecting="isSelecting"
          :index="i"
          @toggle-select="(id: string) => emit('toggleSelect', id)"
          @open-folder="(f: FileItem) => emit('openFolder', f)"
          @open-file="(f: FileItem) => emit('openFile', f)"
          @file-action="(f: FileItem) => emit('fileAction', f)"
        />
      </div>
    </div>
  </template>

  <EmptyState v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FileListItem from './FileListItem.vue'
import FileGridItem from './FileGridItem.vue'
import EmptyState from './EmptyState.vue'
import type { FileItem } from '@/types'

const props = withDefaults(defineProps<{
  /** 视图类型：列表模式或宫格模式 */
  type?: 'list' | 'grid'
  /** 文件列表数据 */
  files?: FileItem[]
  /** 当前选中的文件 ID 集合 */
  selectedIds?: Set<string>
}>(), {
  type: 'list',
  files: () => [],
  selectedIds: () => new Set(),
})

const emit = defineEmits<{
  /** 切换单个文件的选中状态 */
  toggleSelect: [id: string]
  /** 打开文件夹 */
  openFolder: [file: FileItem]
  /** 打开文件 */
  openFile: [file: FileItem]
  /** 触发文件操作 */
  fileAction: [file: FileItem]
}>()

const isSelecting = computed(() => props.selectedIds.size > 0)
</script>
