<script setup lang="ts">
/**
 * 下拉刷新（页面级手势）
 * ------------------------------------------------------------
 * 用法：
 *   <PullToRefresh :loading="refreshing" @refresh="onRefresh">
 *     …列表内容…
 *   </PullToRefresh>
 *
 * - 监听 window 层手势：当页面处于顶部（scrollY <= 0）且手指/鼠标
 *   下拉时，将内容整体下移，并显示「下拉刷新 / 松开刷新 / 正在刷新」。
 * - 松手且下拉距离达到阈值后触发 refresh 事件；刷新期间内容保持
 *   在阈值高度，由父级通过 loading 置 false 通知结束并回弹。
 * - 触摸通道负责阻止原生橡皮筋/浏览器刷新手势；鼠标通道便于桌面
 *   预览与联调（拖动后自动抑制误触发的 click）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AppIcon from '@/components/AppIcon.vue'

/** 触发阈值：下拉超过该距离后松手即刷新（px） */
const TRIGGER = 56
/** 下拉最大位移（px），超出后继续施加阻力 */
const MAX_PULL = 140
/** 鼠标判定为“拖动”而非点击的最小位移（px） */
const DRAG_SLOP = 4

const props = withDefaults(
  defineProps<{
    /** 父级刷新中状态：true 期间保持展开，false 后回弹 */
    loading?: boolean
  }>(),
  { loading: false },
)

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

/** 当前内容下移距离（px） */
const offset = ref(0)
/** 是否正处于刷新中（本地状态，待 props.loading 归位后复位） */
const refreshing = ref(false)
/** 是否正在拖拽（拖拽中不启用回弹过渡，保证跟手） */
const dragging = ref(false)
/** 鼠标拖拽后抑制本次 click（避免误触列表项） */
const suppressClick = ref(false)

let active: 'mouse' | 'touch' | null = null
let startY = 0
let mouseMoved = false

/** 距离阻尼：越往下拉越费力，逼近上限 */
function damp(dy: number): number {
  if (dy <= 0) return 0
  if (dy <= 90) return Math.min(MAX_PULL, Math.round(dy * 0.6))
  return Math.min(MAX_PULL, Math.round(54 + (dy - 90) * 0.3))
}

function applyMove(y: number, prevent?: () => void): void {
  if (!active) return
  // 页面仍在滚动中：跟随刷新起点，避免到顶瞬间产生位移跳变
  if (window.scrollY > 0) {
    if (active === 'touch') startY = y
    return
  }
  const dy = y - startY
  if (dy > 0) {
    if (active === 'mouse' && !mouseMoved && dy > DRAG_SLOP) mouseMoved = true
    prevent?.()
    offset.value = damp(dy)
  } else if (offset.value > 0) {
    prevent?.()
    offset.value = 0
  }
}

function beginDrag(mode: 'mouse' | 'touch', y: number): void {
  if (refreshing.value || active) return
  if (mode === 'mouse' && window.scrollY > 0) return
  active = mode
  startY = y
  mouseMoved = false
  dragging.value = true
}

function finishDrag(): void {
  if (!active) return
  const wasMouse = active === 'mouse'
  active = null
  dragging.value = false
  if (wasMouse) suppressClick.value = mouseMoved
  mouseMoved = false
  if (refreshing.value) return
  if (offset.value >= TRIGGER) {
    refreshing.value = true
    offset.value = TRIGGER
    emit('refresh')
  } else {
    offset.value = 0
  }
  // click 已在 pointerup 后紧随派发，这里延迟清除抑制标记
  window.setTimeout(() => {
    suppressClick.value = false
  }, 0)
}

/* ---------- 触摸（核心：阻止原生滚动/浏览器下拉刷新） ---------- */
function onTouchStart(e: TouchEvent): void {
  if (refreshing.value) return
  const t = e.touches[0]
  if (!t) return
  beginDrag('touch', t.clientY)
}

function onTouchMove(e: TouchEvent): void {
  if (active !== 'touch') return
  const t = e.touches[0]
  if (!t) return
  applyMove(t.clientY, () => e.preventDefault())
}

function onTouchEnd(): void {
  if (active === 'touch') finishDrag()
}

/* ---------- 鼠标 / 触控笔（桌面预览与联调） ---------- */
function onPointerDown(e: PointerEvent): void {
  if (e.pointerType === 'touch') return
  if (e.button !== 0) return
  e.preventDefault() // 防止拖拽过程中选中文字
  beginDrag('mouse', e.clientY)
}

function onPointerMove(e: PointerEvent): void {
  if (active !== 'mouse') return
  if ((e.buttons & 1) === 0) {
    finishDrag()
    return
  }
  applyMove(e.clientY)
}

function onPointerUp(): void {
  if (active === 'mouse') finishDrag()
}

function onCaptureClick(e: Event): void {
  if (!suppressClick.value) return
  e.preventDefault()
  e.stopPropagation()
  suppressClick.value = false
}

/* ---------- 父级结束刷新后回弹 ---------- */
watch(
  () => props.loading,
  (v) => {
    if (v) return
    if (refreshing.value) {
      refreshing.value = false
      offset.value = 0
    }
  },
)

const contentStyle = computed(() => ({
  transform: `translate3d(0, ${offset.value}px, 0)`,
}))

const showBadge = computed(() => refreshing.value || offset.value > 0)
const releaseHint = computed(() => offset.value >= TRIGGER)

onMounted(() => {
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  window.addEventListener('pointercancel', onPointerUp, { passive: true })
  document.addEventListener('click', onCaptureClick, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('touchcancel', onTouchEnd)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  document.removeEventListener('click', onCaptureClick, true)
})
</script>

<template>
  <div class="ptr">
    <!-- 下拉提示：位于内容层之下，随内容下移而从顶部露出 -->
    <div class="ptr__badge" :class="{ 'ptr__badge--show': showBadge }" aria-hidden="true">
      <div class="ptr__chip">
        <span v-if="refreshing" class="ptr__spinner" />
        <AppIcon v-else class="ptr__arrow" name="chevron-left" :size="0.875" />
        <span>{{ refreshing ? '正在刷新…' : releaseHint ? '松开刷新' : '下拉刷新' }}</span>
      </div>
    </div>

    <!-- 内容层：拖拽/刷新期间整体下移 -->
    <div
      class="ptr__content"
      :class="{ 'ptr__content--no-anim': dragging }"
      :style="contentStyle"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.ptr {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  // 提示胶囊：压在内容层之下，仅在内容下移露出的空隙里显示
  // 顶部偏移必须走 var(--safe-top)：Android 外壳按状态栏真实尺寸注入该变量，
  // 而 env(safe-area-inset-top) 在 WebView 中恒为 0（见 base.scss 安全区约定）。
  &__badge {
    position: absolute;
    top: calc(var(--safe-top, 0rem) + 0.625rem);
    left: 0;
    right: 0;
    z-index: 0;
    display: flex;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s ease;

    &--show {
      opacity: 1;
    }
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.4375rem 0.875rem;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    box-shadow: var(--shadow-card);
    color: var(--color-ink-700);
    font-size: 0.8125rem;
    font-weight: 500;
    backdrop-filter: blur(0.25rem);
  }

  &__arrow {
    color: var(--color-brand-500);
    transform: rotate(-90deg); // chevron-left 转为指向下方
  }

  // 内容层：常态回弹过渡；拖拽中跟手（无过渡）
  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;

    &--no-anim {
      transition: none;
    }
  }

  &__spinner {
    width: 1rem;
    height: 1rem;
    border: 0.125rem solid var(--color-brand-200);
    border-top-color: var(--color-brand-600);
    border-radius: 50%;
    animation: ptr-spin 0.7s linear infinite;
  }
}

@keyframes ptr-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
