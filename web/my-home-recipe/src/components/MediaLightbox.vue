<script setup lang="ts">
/**
 * 图片全屏预览（详情/编辑页查看大图）
 * ------------------------------------------------------------
 * 用法（保持对外 API 不变，内部由 PhotoSwipe v5 驱动）：
 *   <MediaLightbox v-model:open="show" :srcs="imageSrcs" :start="index" />
 * PhotoSwipe 提供手势：左右滑动切换、单/双指缩放、双击放大、
 * 顶部/按钮关闭与计数，自带转场动画与键盘支持。
 */
import { onBeforeUnmount, watch } from 'vue'
import PhotoSwipe from 'photoswipe'
import type { PhotoSwipeOptions } from 'photoswipe'
import 'photoswipe/dist/photoswipe.css'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** 图片来源（已就绪的 URL 列表） */
    srcs: string[]
    /** 初始展示第几张 */
    start?: number
  }>(),
  { start: 0 },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

let pswp: PhotoSwipe | null = null
/** 打开流程进行中（尺寸探测异步） */
let opening = false

/**
 * PhotoSwipe 需要图片宽高做布局与过渡计算。
 * 逐张预加载获取自然尺寸；失败时用占位尺寸兜底。
 */
function probeSize(src: string): Promise<{ src: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const fallback = { src, width: 1600, height: 1200 }
    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth || fallback.width
      const height = img.naturalHeight || fallback.height
      resolve({ src, width, height })
    }
    img.onerror = () => resolve(fallback)
    img.src = src
  })
}

/** 销毁当前实例（若处于关闭动画中也强制移除） */
function dispose(): void {
  const instance = pswp
  if (!instance) return
  pswp = null
  try {
    instance.destroy()
  } catch {
    // 已销毁则忽略
  }
}

async function openGallery(): Promise<void> {
  if (pswp || opening || props.srcs.length === 0) return
  opening = true
  try {
    const items = await Promise.all(props.srcs.map(probeSize))
    // 异步探测期间可能已被关闭
    if (pswp || !props.open) return

    const index = Math.min(Math.max(props.start, 0), Math.max(items.length - 1, 0))
    const options: PhotoSwipeOptions = {
      dataSource: items,
      index,
      bgOpacity: 0.95,
      spacing: 0.08,
    }
    const instance = new PhotoSwipe(options)
    pswp = instance
    // 用户关闭（关闭按钮/点背景/ESC/手势）时同步 v-model
    instance.on('close', () => {
      pswp = null
      emit('update:open', false)
    })
    instance.init()
  } finally {
    opening = false
  }
}

function closeGallery(): void {
  if (!pswp) return
  const instance = pswp
  pswp = null
  // 正常动画关闭；close 事件仍会同步 v-model
  instance.close()
}

watch(
  () => props.open,
  (value) => {
    if (value) void openGallery()
    else closeGallery()
  },
)

onBeforeUnmount(() => {
  dispose()
})
</script>

<template>
  <!-- PhotoSwipe 自行挂载全屏层，无需额外 UI -->
  <div class="media-lightbox" aria-hidden="true" />
</template>
