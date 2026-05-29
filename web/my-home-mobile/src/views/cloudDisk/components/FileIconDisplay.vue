<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import {
  FolderIcon, ImageIcon, VideoIcon, MusicIcon, FileTextIcon, ArchiveIcon, FileIcon,
} from 'lucide-vue-next'
import type { FileType } from '@/types'
import { loadThumbnail, revokeThumbnail } from '@/utils/thumbnail'

const props = withDefaults(defineProps<{
  type: FileType
  size?: number
  /** 文件路径，仅 image 类型需要，用于加载缩略图 */
  filePath?: string
}>(), {
  size: 22,
})

const typeConfig: Record<FileType, {
  Icon: typeof FolderIcon
  colorClass: string
  bgClass: string
}> = {
  folder:  { Icon: FolderIcon,   colorClass: 'text-indigo-500',  bgClass: 'bg-indigo-100/80'  },
  image:   { Icon: ImageIcon,    colorClass: 'text-emerald-500', bgClass: 'bg-emerald-100/80' },
  video:   { Icon: VideoIcon,    colorClass: 'text-rose-400',    bgClass: 'bg-rose-100/80'    },
  audio:   { Icon: MusicIcon,    colorClass: 'text-amber-500',   bgClass: 'bg-amber-100/80'   },
  doc:     { Icon: FileTextIcon, colorClass: 'text-blue-500',    bgClass: 'bg-blue-100/80'    },
  zip:     { Icon: ArchiveIcon,  colorClass: 'text-purple-500',  bgClass: 'bg-purple-100/80'  },
  default: { Icon: FileIcon,     colorClass: 'text-slate-400',   bgClass: 'bg-slate-100/80'   },
}

const cfg = computed(() => typeConfig[props.type] ?? typeConfig.default)
const containerSize = computed(() => Math.round(props.size * 2.1))

// ── 图片缩略图加载 ──
const thumbnailUrl = ref<string | null>(null)
const thumbnailError = ref(false)

watch(
  () => [props.type, props.filePath] as const,
  async ([type, path]) => {
    thumbnailUrl.value = null
    thumbnailError.value = false
    if (type === 'image' && path) {
      const url = await loadThumbnail(path, 300)
      if (url) {
        thumbnailUrl.value = url
      } else {
        thumbnailError.value = true
      }
    }
  },
  { immediate: true },
)

const showThumbnail = computed(() => props.type === 'image' && thumbnailUrl.value && !thumbnailError.value)

onBeforeUnmount(() => {
  if (props.filePath) revokeThumbnail(props.filePath)
})
</script>

<template>
  <div
    data-cmp="FileIconDisplay"
    class="flex items-center justify-center rounded-2xl flex-shrink-0 overflow-hidden"
    :class="showThumbnail ? '' : cfg.bgClass"
    :style="{ width: containerSize + 'px', height: containerSize + 'px' }"
  >
    <img
      v-if="showThumbnail"
      :src="thumbnailUrl!"
      class="w-full h-full object-cover"
      :alt="filePath ?? ''"
      @error="thumbnailError = true"
    />
    <component :is="cfg.Icon" v-else :size="size" :class="cfg.colorClass" :stroke-width="1.6" />
  </div>
</template>
