<script setup lang="ts">
import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-vue-next'
import FileIconDisplay from './FileIconDisplay.vue'
import type { FileItem, LayoutMode } from '@/types'

const props = withDefaults(defineProps<{
  files?: FileItem[]
  layout?: LayoutMode
  selectedIds?: Set<string>
}>(), {
  files: () => [],
  layout: 'list',
  selectedIds: () => new Set(),
})

const emit = defineEmits<{
  toggleSelect: [id: string]
  openFolder: [file: FileItem]
  openFile: [file: FileItem]
  fileAction: [file: FileItem]
}>()

const isSelecting = computed(() => props.selectedIds.size > 0)

function handleItemClick(file: FileItem) {
  if (isSelecting.value) {
    emit('toggleSelect', file.id)
  } else if (file.type === 'folder') {
    emit('openFolder', file)
  } else {
    emit('openFile', file)
  }
}

function handleContextMenu(file: FileItem) {
  emit('toggleSelect', file.id)
}

function formatDate(str: string) {
  const d = new Date(str)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  if (diffDays === 1) return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  if (diffDays < 7) return `${diffDays}天前`
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
}
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <!-- List layout -->
  <div v-if="layout === 'list'" data-cmp="FileList" class="flex flex-col px-4 py-2 gap-2">
    <div
      v-for="(file, i) in files"
      :key="file.id"
      class="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all file-item-appear shadow-custom"
      :class="selectedIds.has(file.id)
        ? 'bg-secondary border border-primary/25'
        : 'bg-card border border-transparent'"
      :style="{ animationDelay: `${i * 0.035}s` }"
      @click="handleItemClick(file)"
      @contextmenu.prevent="handleContextMenu(file)"
    >
      <div
        class="transition-all duration-200 overflow-hidden flex-shrink-0"
        :class="isSelecting ? 'w-6 opacity-100' : 'w-0 opacity-0'"
      >
        <input
          type="checkbox"
          class="file-checkbox"
          :checked="selectedIds.has(file.id)"
          @change="emit('toggleSelect', file.id)"
          @click.stop
        />
      </div>

      <FileIconDisplay :type="file.type" :size="22" :file-path="file.type === 'image' ? file.path : undefined" />

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

    <div v-if="files.length === 0" class="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <div class="text-5xl mb-4">📂</div>
      <div class="text-sm font-medium">此文件夹为空</div>
    </div>
  </div>

  <!-- Grid layout -->
  <div v-else data-cmp="FileList" class="px-4 py-2">
    <div class="flex flex-wrap gap-2.5">
      <div
        v-for="(file, i) in files"
        :key="file.id"
        class="relative flex flex-col rounded-2xl transition-all file-item-appear shadow-custom overflow-hidden"
        :class="selectedIds.has(file.id) ? 'bg-secondary border border-primary/25' : 'bg-card border border-transparent'"
        style="width: calc(33.333% - 7px)"
        :style="{ animationDelay: `${i * 0.035}s` }"
        @click="handleItemClick(file)"
        @contextmenu.prevent="handleContextMenu(file)"
      >
        <div class="flex items-center justify-center pt-4 pb-2.5">
          <FileIconDisplay :type="file.type" :size="26" :file-path="file.type === 'image' ? file.path : undefined" />
        </div>

        <div class="px-2 pb-3">
          <div class="text-xs font-semibold text-foreground text-center truncate leading-snug">{{ file.name }}</div>
        </div>

        <div v-if="isSelecting" class="absolute top-2 right-2">
          <input
            type="checkbox"
            class="file-checkbox"
            :checked="selectedIds.has(file.id)"
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
    </div>

    <div v-if="files.length === 0" class="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <div class="text-5xl mb-4">📂</div>
      <div class="text-sm font-medium">此文件夹为空</div>
    </div>
  </div>
</template>
