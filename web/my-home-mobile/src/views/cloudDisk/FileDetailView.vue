<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon, DownloadIcon, FileTextIcon, ImageIcon, VideoIcon, MusicIcon,
  ArchiveIcon, FileIcon, FolderIcon, CalendarIcon, HardDriveIcon, FolderOpenIcon,
  HashIcon, Maximize2Icon, XIcon,
} from 'lucide-vue-next'
import type { FileItem, FileType } from '@/types'
import { formatDateTime } from './data'
import { downloadCloudFile } from '@/utils/download'
import { loadThumbnail, revokeThumbnail } from '@/utils/thumbnail'
import { cloudDiskGetFileDownloadUrl } from '@/api/modules/cloud-disk'

const TYPE_META: Record<FileType, {
  label: string
  iconBg: string
  iconColor: string
  heroBg: string
  Icon: typeof FileIcon
}> = {
  folder:  { label: '文件夹',  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-500',  heroBg: 'from-indigo-50 to-indigo-100/60',   Icon: FolderIcon   },
  image:   { label: '图片',    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500', heroBg: 'from-emerald-50 to-emerald-100/60', Icon: ImageIcon    },
  video:   { label: '视频',    iconBg: 'bg-rose-100',    iconColor: 'text-rose-400',    heroBg: 'from-rose-50 to-rose-100/60',       Icon: VideoIcon    },
  audio:   { label: '音频',    iconBg: 'bg-amber-100',   iconColor: 'text-amber-500',   heroBg: 'from-amber-50 to-amber-100/60',     Icon: MusicIcon    },
  doc:     { label: '文档',    iconBg: 'bg-blue-100',    iconColor: 'text-blue-500',    heroBg: 'from-blue-50 to-blue-100/60',       Icon: FileTextIcon },
  zip:     { label: '压缩包',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-500',  heroBg: 'from-purple-50 to-purple-100/60',   Icon: ArchiveIcon  },
  default: { label: '文件',    iconBg: 'bg-slate-100',   iconColor: 'text-slate-400',   heroBg: 'from-slate-50 to-slate-100/60',     Icon: FileIcon     },
}

const router = useRouter()
const fileData = history.state as FileItem | null
const file = fileData ?? {
  id: '4',
  name: '项目报告.pdf',
  type: 'doc' as FileType,
  size: '3.2 MB',
  modifiedAt: '2025-06-12T14:22:00',
  path: '/report.pdf',
}

const meta = computed(() => TYPE_META[file.type as FileType] ?? TYPE_META.default)
const isImage = computed(() => file.type === 'image')

// ── 缩略图 & 大图状态 ──
const thumbnailUrl = ref<string | null>(null)
const thumbnailError = ref(false)
const fullImageUrl = ref<string | null>(null)
const fullImageLoading = ref(false)
const showImagePreview = ref(false)

onMounted(() => {
  if (isImage.value && file.path) {
    loadThumbnail(file.path, 400).then((url) => {
      if (url) thumbnailUrl.value = url
      else thumbnailError.value = true
    })
  }
})

onBeforeUnmount(() => {
  if (isImage.value && file.path) revokeThumbnail(file.path)
})

async function openImagePreview() {
  if (!isImage.value || !file.path) return
  fullImageLoading.value = true
  showImagePreview.value = true
  try {
    const res = await cloudDiskGetFileDownloadUrl({ filePath: file.path })
    fullImageUrl.value = res.data.data ?? null
  } catch {
    fullImageUrl.value = null
  } finally {
    fullImageLoading.value = false
  }
}

function closeImagePreview() {
  showImagePreview.value = false
  fullImageUrl.value = null
}

async function handleDownload() {
  await downloadCloudFile(file.path, file.name)
}

const showHeroThumbnail = computed(() => isImage.value && thumbnailUrl.value && !thumbnailError.value)
</script>

<template>
  <div data-cmp="FileDetailView" class="min-h-screen bg-background flex flex-col max-w-md mx-auto">
    <header class="flex items-center gap-3 px-5 pt-10 pb-4">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors flex-shrink-0"
      >
        <ArrowLeftIcon :size="18" class="text-foreground" :stroke-width="2.2" />
      </button>
      <div class="text-base font-bold text-foreground flex-1 truncate">文件详情</div>
    </header>

    <!-- Hero -->
    <div class="mx-5 mb-5">
      <div class="rounded-3xl bg-gradient-to-b border border-border shadow-custom flex flex-col items-center justify-center py-10 px-6" :class="meta.heroBg">
        <!-- 图片缩略图 -->
        <div v-if="showHeroThumbnail" class="w-36 h-36 rounded-2xl overflow-hidden bg-white/40 shadow-sm mb-4">
          <img
            :src="thumbnailUrl!"
            :alt="file.name"
            class="w-full h-full object-cover"
            @error="thumbnailError = true"
          />
        </div>
        <!-- 类型图标 -->
        <div v-else class="w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm mb-4" :class="meta.iconBg">
          <component :is="meta.Icon" :size="36" :class="meta.iconColor" :stroke-width="1.5" />
        </div>
        <div class="text-base font-bold text-foreground text-center leading-snug px-2 mb-2">{{ file.name }}</div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :class="[meta.iconBg, meta.iconColor]">{{ meta.label }}</span>
          <span v-if="file.size" class="text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 text-muted-foreground border border-border">{{ file.size }}</span>
        </div>
        <!-- 查看大图按钮 -->
        <button
          v-if="isImage"
          @click="openImagePreview"
          class="mt-4 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/70 text-emerald-600 border border-emerald-200 active:bg-emerald-50 transition-colors"
        >
          <Maximize2Icon :size="13" :stroke-width="2" />
          查看原图
        </button>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="mx-5 mb-5">
      <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">基本信息</div>
      <div class="bg-card rounded-2xl border border-border shadow-custom px-4">
        <div class="flex items-center gap-3 py-3.5 border-b border-border">
          <div class="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <HashIcon :size="13" class="text-muted-foreground" :stroke-width="2" />
          </div>
          <span class="text-sm text-muted-foreground flex-shrink-0 w-16">文件名</span>
          <span class="text-sm font-medium text-foreground flex-1 text-right truncate">{{ file.name }}</span>
        </div>
        <div v-if="file.size" class="flex items-center gap-3 py-3.5 border-b border-border">
          <div class="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <HardDriveIcon :size="13" class="text-muted-foreground" :stroke-width="2" />
          </div>
          <span class="text-sm text-muted-foreground flex-shrink-0 w-16">大小</span>
          <span class="text-sm font-medium text-foreground flex-1 text-right truncate">{{ file.size }}</span>
        </div>
        <div class="flex items-center gap-3 py-3.5 border-b border-border">
          <div class="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <FolderOpenIcon :size="13" class="text-muted-foreground" :stroke-width="2" />
          </div>
          <span class="text-sm text-muted-foreground flex-shrink-0 w-16">路径</span>
          <span class="text-sm font-medium text-foreground flex-1 text-right truncate">{{ file.path }}</span>
        </div>
        <div class="flex items-center gap-3 py-3.5 border-b border-border">
          <div class="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <CalendarIcon :size="13" class="text-muted-foreground" :stroke-width="2" />
          </div>
          <span class="text-sm text-muted-foreground flex-shrink-0 w-16">修改时间</span>
          <span class="text-sm font-medium text-foreground flex-1 text-right truncate">{{ formatDateTime(file.modifiedAt) }}</span>
        </div>
        <div v-if="file.type === 'folder' && file.childCount !== undefined" class="flex items-center gap-3 py-3.5">
          <div class="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <FolderIcon :size="13" class="text-muted-foreground" :stroke-width="2" />
          </div>
          <span class="text-sm text-muted-foreground flex-shrink-0 w-16">包含</span>
          <span class="text-sm font-medium text-foreground flex-1 text-right truncate">{{ file.childCount }} 项</span>
        </div>
      </div>
    </div>

    <div class="flex-1" />

    <!-- 下载按钮 -->
    <div class="px-5 pb-10">
      <button
        @click="handleDownload"
        class="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:opacity-80 transition-opacity shadow-custom"
      >
        <DownloadIcon :size="20" :stroke-width="2" />
        下载文件
      </button>
      <p class="text-center text-xs text-muted-foreground mt-2.5">下载任务将在传输页面中显示进度</p>
    </div>

    <!-- 大图预览弹层 -->
    <Teleport to="body">
      <div
        v-if="showImagePreview"
        data-cmp="ImagePreview"
        class="fixed inset-0 z-[999] flex flex-col"
        @click.self="closeImagePreview"
      >
        <!-- 黑色遮罩 -->
        <div class="absolute inset-0 bg-black/90" @click="closeImagePreview" />

        <!-- 顶部栏 -->
        <div class="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
          <button
            @click="closeImagePreview"
            class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30 transition-colors"
          >
            <XIcon :size="18" class="text-white" :stroke-width="2.5" />
          </button>
          <span class="text-sm font-medium text-white/80 truncate mx-3">{{ file.name }}</span>
          <div class="w-9" />
        </div>

        <!-- 图片区域 -->
        <div class="relative z-10 flex-1 flex items-center justify-center overflow-hidden px-2 pb-12">
          <!-- 加载态 -->
          <div v-if="fullImageLoading" class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            <span class="text-xs text-white/50">加载中...</span>
          </div>

          <!-- 图片 -->
          <img
            v-else-if="fullImageUrl"
            :src="fullImageUrl"
            :alt="file.name"
            class="max-w-full max-h-full object-contain rounded-lg"
            @click.stop
          />

          <!-- 加载失败 -->
          <div v-else class="flex flex-col items-center gap-3">
            <ImageIcon :size="48" class="text-white/30" :stroke-width="1" />
            <span class="text-sm text-white/50">图片加载失败</span>
            <button
              @click="openImagePreview"
              class="mt-1 text-xs font-medium px-4 py-2 rounded-full bg-white/20 text-white active:bg-white/30 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
