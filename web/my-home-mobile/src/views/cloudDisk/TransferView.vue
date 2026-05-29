<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, UploadIcon, DownloadIcon, CheckCircleIcon, CircleIcon, XCircleIcon, RefreshCwIcon } from 'lucide-vue-next'

type TransferStatus = 'uploading' | 'downloading' | 'done' | 'failed' | 'waiting'

interface TransferTask {
  id: string
  name: string
  size: string
  type: TransferStatus
  progress: number
  speed?: string
  time?: string
}

const MOCK_TASKS: TransferTask[] = [
  { id: '1', name: '宣传视频.mp4',        size: '124 MB', type: 'uploading',   progress: 68, speed: '2.3 MB/s' },
  { id: '2', name: '源代码备份.zip',       size: '45.1 MB', type: 'uploading',  progress: 31, speed: '1.1 MB/s' },
  { id: '3', name: '产品设计稿.png',       size: '8.7 MB',  type: 'done',       progress: 100, time: '刚刚' },
  { id: '4', name: '项目报告.pdf',         size: '3.2 MB',  type: 'done',       progress: 100, time: '2分钟前' },
  { id: '5', name: '会议录音.mp3',         size: '22 MB',   type: 'downloading', progress: 55, speed: '3.8 MB/s' },
  { id: '6', name: '财务数据.xlsx',        size: '1.1 MB',  type: 'failed',     progress: 42, time: '5分钟前' },
  { id: '7', name: '团队合照.jpg',         size: '4.2 MB',  type: 'waiting',    progress: 0 },
  { id: '8', name: '品牌LOGO.png',         size: '450 KB',  type: 'waiting',    progress: 0 },
]

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; dotColor: string }> = {
  uploading:   { label: '上传中',   color: 'text-primary',      dotColor: 'bg-primary'      },
  downloading: { label: '下载中',   color: 'text-emerald-500',  dotColor: 'bg-emerald-500'  },
  done:        { label: '已完成',   color: 'text-muted-foreground', dotColor: 'bg-emerald-400' },
  failed:      { label: '失败',     color: 'text-destructive',  dotColor: 'bg-destructive'  },
  waiting:     { label: '等待中',   color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
}

type TabKey = 'all' | 'uploading' | 'downloading' | 'done'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',         label: '全部'   },
  { key: 'uploading',   label: '上传'   },
  { key: 'downloading', label: '下载'   },
  { key: 'done',        label: '已完成' },
]

const router = useRouter()
const activeTab = ref<TabKey>('all')

const filteredTasks = computed(() => MOCK_TASKS.filter((t) => {
  if (activeTab.value === 'all') return true
  if (activeTab.value === 'uploading') return t.type === 'uploading' || (t.type === 'waiting')
  if (activeTab.value === 'downloading') return t.type === 'downloading'
  if (activeTab.value === 'done') return t.type === 'done' || t.type === 'failed'
  return true
}))

const activeCount = MOCK_TASKS.filter((t) => t.type === 'uploading' || t.type === 'downloading').length
</script>

<template>
  <div data-cmp="TransferView" class="relative min-h-screen bg-background flex flex-col max-w-md mx-auto overflow-x-hidden">

    <header class="px-5 pt-10 pb-4 bg-transparent">
      <div class="flex items-center gap-3 mb-1">
        <button
          @click="router.push('/cloud')"
          class="w-9 h-9 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors"
        >
          <ArrowLeftIcon :size="16" class="text-foreground" :stroke-width="2.5" />
        </button>
        <div>
          <div class="text-lg font-bold text-foreground">文件传输</div>
          <div class="text-xs text-muted-foreground">{{ activeCount }} 个任务进行中</div>
        </div>
      </div>
    </header>

    <div class="flex items-center gap-2 px-5 pb-3">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-4 py-1.5 rounded-2xl text-xs font-semibold transition-all flex-shrink-0"
        :class="activeTab === tab.key
          ? 'bg-primary text-primary-foreground shadow-custom'
          : 'bg-card border border-border text-muted-foreground'"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex-1 px-4 pb-32 flex flex-col gap-2.5">
      <div
        v-for="(task, i) in filteredTasks"
        :key="task.id"
        class="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-card border border-transparent shadow-custom file-item-appear"
        :style="{ animationDelay: `${i * 0.04}s` }"
      >
        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="{
            'bg-secondary': task.type === 'uploading',
            'bg-emerald-50': task.type === 'downloading',
            'bg-muted': task.type === 'done' || task.type === 'waiting',
            'bg-destructive/10': task.type === 'failed',
          }"
        >
          <UploadIcon v-if="task.type === 'uploading'" :size="16" class="text-primary" :stroke-width="2" />
          <DownloadIcon v-else-if="task.type === 'downloading'" :size="16" class="text-emerald-500" :stroke-width="2" />
          <CheckCircleIcon v-else-if="task.type === 'done'" :size="16" class="text-emerald-400" :stroke-width="2" />
          <XCircleIcon v-else-if="task.type === 'failed'" :size="16" class="text-destructive" :stroke-width="2" />
          <CircleIcon v-else :size="16" class="text-muted-foreground" :stroke-width="2" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold text-foreground truncate max-w-[60%]">{{ task.name }}</span>
            <span class="text-xs font-medium" :class="STATUS_CONFIG[task.type].color">{{ STATUS_CONFIG[task.type].label }}</span>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="{
                'bg-primary': task.type === 'uploading',
                'bg-emerald-400': task.type === 'downloading' || task.type === 'done',
                'bg-destructive': task.type === 'failed',
                'bg-muted-foreground/30': task.type === 'waiting',
              }"
              :style="{ width: `${task.progress}%` }"
            />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">{{ task.size }}</span>
            <span class="text-xs text-muted-foreground">
              {{ (task.type === 'uploading' || task.type === 'downloading') ? task.speed : task.time ?? '' }}
            </span>
          </div>
        </div>

        <div class="flex-shrink-0">
          <button v-if="task.type === 'failed'" class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors">
            <RefreshCwIcon :size="14" class="text-muted-foreground" :stroke-width="2" />
          </button>
        </div>
      </div>

      <div v-if="filteredTasks.length === 0" class="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <div class="text-5xl mb-4">📭</div>
        <div class="text-sm font-medium">暂无传输任务</div>
      </div>
    </div>
  </div>
</template>
