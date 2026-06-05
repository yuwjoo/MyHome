<!--
  顶部操作栏组件
  包含搜索入口、传输任务入口和新建按钮
-->
<template>
  <header class="px-5 pt-10 pb-4 bg-transparent flex items-center justify-between gap-2">
    <!-- 搜索入口 -->
    <button
      @click="router.push('/search')"
      class="flex items-center gap-2 h-10 px-3.5 rounded-2xl bg-card border border-border shadow-custom active:border-primary/40 transition-colors"
      style="width: 47%; min-width: 0"
    >
      <SearchIcon :size="14" class="text-muted-foreground flex-shrink-0" :stroke-width="2.5" />
      <span class="text-sm text-muted-foreground truncate">搜索文件...</span>
    </button>

    <div class="flex items-center gap-2 flex-shrink-0">
      <!-- 传输任务入口 -->
      <div class="relative">
        <button
          @click="router.push('/transfer')"
          class="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors"
        >
          <ArrowRightLeftIcon :size="16" class="text-foreground" :stroke-width="2" />
        </button>
        <span
          v-if="downloadCount > 0"
          class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none shadow-sm"
        >
          {{ downloadCount > 99 ? '99+' : downloadCount }}
        </span>
      </div>

      <!-- 新建按钮 -->
      <button
        @click="emit('add')"
        class="w-10 h-10 flex items-center justify-center rounded-full bg-primary active:bg-primary/80 transition-colors shadow-custom"
      >
        <PlusIcon :size="20" class="text-primary-foreground" :stroke-width="2.5" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SearchIcon, ArrowRightLeftIcon, PlusIcon } from 'lucide-vue-next'

const router = useRouter()

withDefaults(defineProps<{
  /** 当前下载任务数量 */
  downloadCount?: number
}>(), {
  downloadCount: 0,
})

const emit = defineEmits<{
  /** 点击新建按钮 */
  add: []
}>()
</script>
