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
          v-if="transferActiveCount > 0"
          class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none shadow-sm"
        >
          {{ transferActiveCount > 99 ? '99+' : transferActiveCount }}
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SearchIcon, ArrowRightLeftIcon, PlusIcon } from 'lucide-vue-next'
import { useFileTransferStore } from '@/modules/fileTransfer'

const router = useRouter()
const fileStore = useFileTransferStore()

/** 活跃传输任务数（上传 + 下载的 WAITING / TRANSFERRING） */
const transferActiveCount = computed(
  () => fileStore.activeTasks.length + fileStore.waitingTasks.length
)

const emit = defineEmits<{
  /** 点击新建按钮 */
  add: []
}>()
</script>
