<!--
  文件夹树节点组件
  支持懒加载展开子文件夹并选中目标路径
-->
<template>
  <div>
    <button
      @click="handleClick"
      class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      :class="isSelected ? 'bg-primary/10 border border-primary/25' : 'bg-transparent active:bg-muted'"
      :style="{ paddingLeft: `${16 + depth * 20}px` }"
    >
      <div class="w-4 flex-shrink-0 flex items-center justify-center">
        <ChevronRightIcon
          v-if="hasChildren"
          :size="13"
          :stroke-width="2.5"
          class="text-muted-foreground transition-transform duration-200"
          :class="{ 'rotate-90': expanded }"
        />
        <span v-else class="w-4" />
      </div>

      <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" :class="isSelected ? 'bg-primary/20' : 'bg-indigo-50'">
        <FolderOpenIcon v-if="expanded && hasChildren" :size="16" :class="isSelected ? 'text-primary' : 'text-indigo-400'" :stroke-width="2" />
        <FolderIcon v-else :size="16" :class="isSelected ? 'text-primary' : 'text-indigo-400'" :stroke-width="2" />
      </div>

      <span class="flex-1 text-sm font-medium text-left truncate" :class="isSelected ? 'text-primary font-semibold' : 'text-foreground'">
        {{ node.name }}
      </span>

      <CheckIcon v-if="isSelected" :size="15" class="text-primary flex-shrink-0" :stroke-width="2.5" />
    </button>

    <div v-if="expanded && isLoaded && node.children && node.children.length > 0">
      <FolderTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        @select="(path: string, name: string) => emit('select', path, name)"
        @expand="(n: FolderNode) => emit('expand', n)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRightIcon, CheckIcon, FolderIcon, FolderOpenIcon } from 'lucide-vue-next'
import type { FolderNode } from '../../data'

const props = defineProps<{
  /** 当前文件夹节点数据 */
  node: FolderNode
  /** 树节点深度，用于控制缩进 */
  depth: number
  /** 当前选中的路径，用于高亮匹配 */
  selectedPath: string
}>()

const emit = defineEmits<{
  /** 选中当前文件夹，传递路径和名称 */
  select: [path: string, name: string]
  /** 展开子文件夹，用于懒加载 */
  expand: [node: FolderNode]
}>()

const expanded = ref(props.depth === 0)
const hasChildren = computed(() => {
  // 如果 children 为 undefined，说明未加载（可能有子项）
  // 如果为空数组，说明已加载但无子项
  return props.node.children === undefined || props.node.children.length > 0
})
const isLoaded = computed(() => props.node.children !== undefined)
const isSelected = computed(() => props.selectedPath === props.node.path)

function handleClick() {
  emit('select', props.node.path, props.node.name)
  if (hasChildren.value) {
    if (!isLoaded.value) {
      // 懒加载子项
      emit('expand', props.node)
    }
    expanded.value = !expanded.value
  }
}
</script>
