<script setup lang="ts">
/**
 * 视频全屏预览（详情/编辑页播放视频）
 * ------------------------------------------------------------
 * 用法：
 *   <VideoLightbox v-model:open="show" :src="playableUrl" poster="封面" name="视频名" />
 * 内部使用开源 Plyr 播放器（MIT）：
 *  - 播放/暂停、进度条、全屏（精简控制条，无音量/设置）；
 *  - 点击播放器外（黑边）/ 浮动关闭按钮 / Esc 关闭。
 * src 为可播放直链（本地 blob URL 或云端签名地址），
 * 每次打开前由调用方就绪；关闭时组件自毁播放器实例。
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

import AppIcon from '@/components/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** 可播放直链（本地 blob / 云端签名地址） */
    src: string
    /** 封面图地址 */
    poster?: string
    /** 视频名称（为兼容调用方保留，界面已不再展示） */
    name?: string
  }>(),
  { poster: '', name: '' },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

/** Plyr 挂载区域（视频元素由 DOM API 创建，避免与 Vue 渲染冲突） */
const host = ref<HTMLDivElement | null>(null)
let player: Plyr | null = null

/** 中文控制条文案 */
const I18N_ZH: Record<string, string> = {
  play: '播放',
  pause: '暂停',
  played: '播放进度',
  buffered: '缓冲进度',
  currentTime: '当前时间',
  duration: '总时长',
  enterFullscreen: '全屏',
  exitFullscreen: '退出全屏',
}

function lockBody(locked: boolean): void {
  document.body.style.overflow = locked ? 'hidden' : ''
}

/** 销毁播放器，还原挂载区 */
function teardown(): void {
  if (player) {
    try {
      player.destroy()
    } catch {
      // 实例异常时忽略
    }
    player = null
  }
  if (host.value) host.value.innerHTML = ''
  lockBody(false)
}

/** 打开：动态创建 <video> 并由 Plyr 接管 */
async function mount(): Promise<void> {
  if (!props.open || player || !props.src || !host.value) return
  const hostEl = host.value
  hostEl.innerHTML = ''

  const video = document.createElement('video')
  video.playsInline = true
  video.preload = 'auto'
  if (props.poster) video.poster = props.poster
  video.src = props.src
  hostEl.appendChild(video)

  const instance = new Plyr(video, {
    controls: ['play-large', 'play', 'progress', 'current-time', 'fullscreen'],
    i18n: I18N_ZH,
  })
  player = instance
  lockBody(true)

  // 打开即尝试播放（点击产生的短暂激活期内通常可成功；
  // 浏览器策略拦截时保持暂停，用户点击大播放键即可）
  try {
    await instance.play()
  } catch {
    // 忽略自动播放限制
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      // 等遮罩（含挂载区）渲染完成后再创建播放器
      await nextTick()
      void mount()
    } else {
      teardown()
    }
  },
)

// 播放源就绪前已打开（少见）或换源时重建
watch(
  () => props.src,
  async () => {
    if (props.open) {
      teardown()
      await nextTick()
      void mount()
    }
  },
)

function close(): void {
  emit('update:open', false)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) close()
}

window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  teardown()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="video-lightbox">
      <div v-if="open" class="video-lightbox">
        <!-- 浮动关闭按钮（不占布局，标题已精简掉） -->
        <button
          type="button"
          class="video-lightbox__close"
          aria-label="关闭预览"
          @click="close"
        >
          <AppIcon name="close" :size="1.375" />
        </button>

        <!-- 播放器区（点击黑边关闭；Plyr 内部点击由控件接管） -->
        <div class="video-lightbox__stage" @click.self="close">
          <div ref="host" class="video-lightbox__host" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.video-lightbox {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
  flex-direction: column;
  background: rgba(12, 9, 6, 0.98);

  // Plyr 主题色跟随应用品牌色
  --plyr-color-main: var(--color-brand-500, #e05e34);
  --plyr-control-spacing: 0.75rem;
  --plyr-video-controls-background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.72));

  &__close {
    position: absolute;
    top: calc(var(--safe-top, 0rem) + 0.75rem);
    right: 0.75rem;
    z-index: 20;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.375rem;
    height: 2.375rem;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }

    &:active {
      background: rgba(0, 0, 0, 0.55);
    }
  }

  &__stage {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
    background: #000;
  }

  /* Plyr 播放器铺满舞台，画面 letterbox（object-fit: contain） */
  &__host,
  :deep(.plyr),
  :deep(.plyr__video-wrapper) {
    width: 100%;
    height: 100%;
  }

  :deep(.plyr video) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
}

/* 淡入淡出 */
.video-lightbox-enter-active,
.video-lightbox-leave-active {
  transition: opacity 0.2s ease;
}

.video-lightbox-enter-from,
.video-lightbox-leave-to {
  opacity: 0;
}
</style>
