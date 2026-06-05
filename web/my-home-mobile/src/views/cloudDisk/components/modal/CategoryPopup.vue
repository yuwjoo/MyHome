<!--
  分类选择器组件
  底部弹出的文件类型筛选面板
-->
<template>
  <!-- 分类选择遮罩层 -->
  <div
    class="fixed inset-0 z-50"
    :class="{ 'pointer-events-none': !visible }"
    @click="emit('close')"
    @touchmove.prevent
  >
    <!-- 半透明背景 -->
    <div
      class="absolute inset-0 bg-foreground/20 transition-opacity duration-200"
      :class="visible ? 'opacity-100' : 'opacity-0'"
    />
    <!-- 底部弹出面板 -->
    <div
      class="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-custom border-t border-border px-4 pt-4 pb-8 transition-all duration-300"
      :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'"
      @click.stop
    >
      <div class="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
      <div
        v-for="(row, ri) in TAB_ROWS"
        :key="ri"
        class="flex items-stretch gap-2 mb-2 last:mb-0"
      >
        <template v-for="(tab, ci) in row" :key="ci">
          <!-- 占位符 -->
          <div v-if="!tab" class="flex-1" />
          <!-- 分类按钮 -->
          <button
            v-else
            @click="emit('select', tab.key)"
            class="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all"
            :class="activeFilter === tab.key
              ? `${TAB_COLORS[tab.key].active} tab-active-pill border border-primary/20`
              : 'text-muted-foreground bg-muted/40 active:bg-muted'"
          >
            <component :is="tab.Icon" :size="20" :stroke-width="2" />
            <span class="text-xs font-medium leading-none">{{ tab.label }}</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { FileTypeFilter } from '../../data'
import { TYPE_TABS, TAB_COLORS } from '../../composables/useTypeFilter'

const props = defineProps<{
  /** 是否显示分类选择器 */
  visible: boolean
  /** 当前激活的筛选类型 */
  activeFilter: FileTypeFilter
}>()

const emit = defineEmits<{
  /** 选中某个分类，传递分类 key */
  select: [key: FileTypeFilter]
  /** 关闭选择器 */
  close: []
}>()

watch(
  () => props.visible,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  },
)

const TAB_ROWS = [
  [TYPE_TABS[0], TYPE_TABS[1], TYPE_TABS[2]],
  [TYPE_TABS[3], TYPE_TABS[4], TYPE_TABS[5]],
  [TYPE_TABS[6], null, null],
] as const
</script>
