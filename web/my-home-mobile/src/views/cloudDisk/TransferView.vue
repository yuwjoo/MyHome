<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  UploadIcon,
  DownloadIcon,
  CheckCircleIcon,
  CircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  AlertTriangleIcon,
} from 'lucide-vue-next'
import {
  useFileTransferStore,
  TransferTaskStatus,
  TransferType,
} from '@/modules/fileTransfer'
import type { TransferTask } from '@/modules/fileTransfer'

const router = useRouter()
const store = useFileTransferStore()

type TabKey = 'all' | 'upload' | 'download' | 'done'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'upload', label: '上传' },
  { key: 'download', label: '下载' },
  { key: 'done', label: '已完成' },
]

const activeTab = ref<TabKey>('all')

const filteredTaskList = computed(() => {
  const all = store.taskList
  switch (activeTab.value) {
    case 'upload':
      return all.filter(
        (t) =>
          t.transferType === TransferType.UPLOAD &&
          (t.taskStatus === TransferTaskStatus.WAITING ||
            t.taskStatus === TransferTaskStatus.TRANSFERRING ||
            t.taskStatus === TransferTaskStatus.PAUSED)
      )
    case 'download':
      return all.filter(
        (t) =>
          t.transferType === TransferType.DOWNLOAD &&
          (t.taskStatus === TransferTaskStatus.WAITING ||
            t.taskStatus === TransferTaskStatus.TRANSFERRING ||
            t.taskStatus === TransferTaskStatus.PAUSED)
      )
    case 'done':
      return all.filter(
        (t) =>
          t.taskStatus === TransferTaskStatus.SUCCESS ||
          t.taskStatus === TransferTaskStatus.FAILED ||
          t.taskStatus === TransferTaskStatus.INTERRUPTED ||
          t.taskStatus === TransferTaskStatus.CANCELED
      )
    default:
      return all
  }
})

const activeCount = computed(
  () =>
    store.taskList.filter(
      (t) =>
        t.taskStatus === TransferTaskStatus.TRANSFERRING ||
        t.taskStatus === TransferTaskStatus.WAITING
    ).length
)

type DisplayStatus = 'uploading' | 'downloading' | 'waiting' | 'done' | 'failed' | 'paused' | 'canceled'

interface StatusConfig {
  label: string
  color: string
  dotColor: string
}

const STATUS_CONFIG: Record<DisplayStatus, StatusConfig> = {
  uploading: { label: '上传中', color: 'text-primary', dotColor: 'bg-primary' },
  downloading: { label: '下载中', color: 'text-emerald-500', dotColor: 'bg-emerald-500' },
  waiting: { label: '等待中', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  done: { label: '已完成', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
  failed: { label: '失败', color: 'text-destructive', dotColor: 'bg-destructive' },
  paused: { label: '已暂停', color: 'text-amber-500', dotColor: 'bg-amber-500' },
  canceled: { label: '已取消', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
}

function getDisplayStatus(task: TransferTask): DisplayStatus {
  const s = task.taskStatus
  if (s === TransferTaskStatus.TRANSFERRING) {
    return task.transferType === TransferType.UPLOAD ? 'uploading' : 'downloading'
  }
  if (s === TransferTaskStatus.WAITING) return 'waiting'
  if (s === TransferTaskStatus.SUCCESS) return 'done'
  if (s === TransferTaskStatus.FAILED || s === TransferTaskStatus.INTERRUPTED) return 'failed'
  if (s === TransferTaskStatus.PAUSED) return 'paused'
  return 'canceled'
}

const BG_CLASS: Record<DisplayStatus, string> = {
  uploading: 'bg-secondary',
  downloading: 'bg-emerald-50',
  waiting: 'bg-muted',
  done: 'bg-muted',
  failed: 'bg-destructive/10',
  paused: 'bg-amber-50',
  canceled: 'bg-muted',
}

const PROGRESS_CLASS: Record<DisplayStatus, string> = {
  uploading: 'bg-primary',
  downloading: 'bg-emerald-400',
  waiting: 'bg-muted-foreground/30',
  done: 'bg-emerald-400',
  failed: 'bg-destructive',
  paused: 'bg-amber-400',
  canceled: 'bg-muted-foreground/30',
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[i]!}`
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return ''
  return `${formatSize(bytesPerSec)}/s`
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  return `${Math.floor(diff / 86_400_000)}天前`
}

function getSubText(task: TransferTask): string {
  if (
    task.taskStatus === TransferTaskStatus.TRANSFERRING ||
    task.taskStatus === TransferTaskStatus.WAITING ||
    task.taskStatus === TransferTaskStatus.PAUSED
  ) {
    return formatSpeed(task.speed)
  }
  if (task.finishTime) return formatRelativeTime(task.finishTime)
  return ''
}
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
        v-for="(task, i) in filteredTaskList"
        :key="task.taskId"
        class="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-card border border-transparent shadow-custom file-item-appear"
        :style="{ animationDelay: `${i * 0.04}s` }"
      >
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="BG_CLASS[getDisplayStatus(task)]"
        >
          <UploadIcon
            v-if="getDisplayStatus(task) === 'uploading'"
            :size="16" class="text-primary" :stroke-width="2"
          />
          <DownloadIcon
            v-else-if="getDisplayStatus(task) === 'downloading'"
            :size="16" class="text-emerald-500" :stroke-width="2"
          />
          <CheckCircleIcon
            v-else-if="getDisplayStatus(task) === 'done'"
            :size="16" class="text-emerald-400" :stroke-width="2"
          />
          <XCircleIcon
            v-else-if="getDisplayStatus(task) === 'failed'"
            :size="16" class="text-destructive" :stroke-width="2"
          />
          <PauseIcon
            v-else-if="getDisplayStatus(task) === 'paused'"
            :size="16" class="text-amber-500" :stroke-width="2"
          />
          <AlertTriangleIcon
            v-else-if="getDisplayStatus(task) === 'canceled'"
            :size="16" class="text-muted-foreground" :stroke-width="2"
          />
          <CircleIcon
            v-else
            :size="16" class="text-muted-foreground" :stroke-width="2"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold text-foreground truncate max-w-[55%]">
              {{ task.taskName }}
            </span>
            <span
              class="text-xs font-medium flex-shrink-0"
              :class="STATUS_CONFIG[getDisplayStatus(task)].color"
            >
              {{ STATUS_CONFIG[getDisplayStatus(task)].label }}
            </span>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="PROGRESS_CLASS[getDisplayStatus(task)]"
              :style="{ width: `${task.progress}%` }"
            />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">{{ formatSize(task.totalSize) }}</span>
            <span class="text-xs text-muted-foreground">{{ getSubText(task) }}</span>
          </div>
        </div>

        <div class="flex-shrink-0 flex items-center gap-1">
          <!-- 重试 -->
          <button
            v-if="task.taskStatus === TransferTaskStatus.FAILED || task.taskStatus === TransferTaskStatus.INTERRUPTED"
            @click="store.retryTask(task.taskId)"
            class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors"
          >
            <RefreshCwIcon :size="14" class="text-foreground" :stroke-width="2" />
          </button>

          <!-- 暂停 -->
          <button
            v-if="task.taskStatus === TransferTaskStatus.TRANSFERRING"
            @click="store.pauseTask(task.taskId)"
            class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors"
          >
            <PauseIcon :size="14" class="text-foreground" :stroke-width="2" />
          </button>

          <!-- 恢复 -->
          <button
            v-if="task.taskStatus === TransferTaskStatus.PAUSED"
            @click="store.resumeTask(task.taskId)"
            class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors"
          >
            <PlayIcon :size="14" class="text-foreground" :stroke-width="2" />
          </button>

          <!-- 取消（等待中/传输中/暂停） -->
          <button
            v-if="
              task.taskStatus === TransferTaskStatus.WAITING ||
              task.taskStatus === TransferTaskStatus.TRANSFERRING ||
              task.taskStatus === TransferTaskStatus.PAUSED
            "
            @click="store.cancelTask(task.taskId)"
            class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors"
          >
            <XCircleIcon :size="14" class="text-muted-foreground" :stroke-width="2" />
          </button>

          <!-- 删除（终态） -->
          <button
            v-if="
              task.taskStatus === TransferTaskStatus.SUCCESS ||
              task.taskStatus === TransferTaskStatus.FAILED ||
              task.taskStatus === TransferTaskStatus.INTERRUPTED ||
              task.taskStatus === TransferTaskStatus.CANCELED
            "
            @click="store.deleteTask(task.taskId)"
            class="w-8 h-8 flex items-center justify-center rounded-xl bg-muted active:bg-border transition-colors"
          >
            <Trash2Icon :size="14" class="text-muted-foreground" :stroke-width="2" />
          </button>
        </div>
      </div>

      <div v-if="filteredTaskList.length === 0" class="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <div class="text-5xl mb-4">📭</div>
        <div class="text-sm font-medium">暂无传输任务</div>
      </div>
    </div>
  </div>
</template>
