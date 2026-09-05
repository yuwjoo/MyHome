<script setup lang="ts">
/**
 * 图片全屏预览（详情/编辑页查看大图）
 * ------------------------------------------------------------
 * 用法（保持对外 API 不变，内部由 PhotoSwipe v5 驱动）：
 *   <MediaLightbox v-model:open="show" :srcs="imageSrcs" :start="index" />
 * PhotoSwipe 提供手势：左右滑动切换、单/双指缩放、双击放大、
 * 顶部/按钮关闭与计数，自带转场动画与键盘支持。
 */
import { onBeforeUnmount, toRef, watch } from 'vue'
import PhotoSwipe from 'photoswipe'
import type { PhotoSwipeOptions } from 'photoswipe'
import 'photoswipe/dist/photoswipe.css'

import { useBackClose } from '@/composables/useBackClose'

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

// 系统返回/浏览器后退先关闭灯箱（不直接离开页面）
useBackClose(toRef(props, 'open'), () => emit('update:open', false))

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

/**
 * 读取原生外壳/浏览器注入的 CSS 安全区变量（CSS px）。
 * Android 外壳注入 --safe-top 等；无外壳时 base.scss 用 env() 兜底。
 */
function readSafeArea(): { top: number; bottom: number; left: number; right: number } {
  const style = getComputedStyle(document.documentElement)
  const parsePx = (name: string): number => {
    const raw = style.getPropertyValue(name).trim()
    const match = /^(-?[\d.]+)px$/.exec(raw)
    return match ? Math.max(0, Number(match[1])) : 0
  }
  return {
    top: parsePx('--safe-top'),
    bottom: parsePx('--safe-bottom'),
    left: parsePx('--safe-left'),
    right: parsePx('--safe-right'),
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
    const safeArea = readSafeArea()
    const options: PhotoSwipeOptions = {
      dataSource: items,
      index,
      bgOpacity: 0.95,
      spacing: 0.08,
      // 内容让位系统栏（刘海/手势条）：幻灯片区域不进入安全区，
      // 避免照片边缘被状态栏与底部手势条遮挡。
      ...(safeArea.top || safeArea.bottom || safeArea.left || safeArea.right
        ? { padding: safeArea }
        : {}),
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

<style>
/*
 * PhotoSwipe 全屏层挂在 <body> 下，需用全局选择器做手机安全区适配：
 * 顶部工具条（计数/关闭按钮）整体下沉到状态栏之下；
 * 幻灯片内容的上下让位由 JS 传入的 padding 处理，样式无需介入。
 * 高特异性避免与 photoswipe.css 的加载顺序耦合。
 */
.pswp .pswp__top-bar {
  top: var(--safe-top, 0px);
}
</style>
