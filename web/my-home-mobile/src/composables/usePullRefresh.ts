import { ref, computed, type Ref } from 'vue'

/**
 * 下拉刷新 composable
 * @param onRefresh    - 刷新回调（返回 Promise）
 * @param threshold    - 触发阈值（px），默认 72
 * @param disabled     - 可选 Ref，为 true 时禁用下拉刷新；变化时会自动清理中途状态
 * @param scrollContainer - 可选，指定滚动容器 Ref。不传时默认监听 window 滚动
 */
export function usePullRefresh(
  onRefresh: () => Promise<void>,
  threshold = 72,
  disabled?: Ref<boolean>,
  scrollContainer?: Ref<HTMLElement | null>,
) {
  const containerRef = ref<HTMLElement | null>(null)
  const pulling = ref(false)
  const refreshing = ref(false)
  const pullDistance = ref(0)

  /** 下拉激活死区（px）：滑动距离低于此值时不做拦截，交给浏览器正常滚动 */
  const PULL_DEAD_ZONE = 10

  let startY: number | null = null
  let isAtTop = false

  // ── 刷新进行中时禁止容器滚动（避免 CSS transform 动画与用户滚动冲突导致页面异常跳顶） ──
  const scrollDisabled = computed(() => refreshing.value)

  // ── 重置所有下拉状态（disabled / 异常退出时调用） ──
  function resetPullState() {
    pulling.value = false
    pullDistance.value = 0
    startY = null
    isAtTop = false
  }

  function handleTouchStart(e: TouchEvent) {
    // 刷新中不记录触摸状态，避免残留 isAtTop/startY 导致后续正常滚动被误判为下拉
    if (disabled?.value || refreshing.value) {
      resetPullState()
      return
    }
    // 优先使用调用方指定的滚动容器，未指定则默认监听 window 滚动
    const container = scrollContainer?.value
    const scrollTop = container
      ? container.scrollTop
      : (window.scrollY || document.documentElement.scrollTop)
    isAtTop = scrollTop <= 0
    if (isAtTop) {
      startY = e.touches[0].clientY
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (disabled?.value) {
      resetPullState()
      return
    }
    // 刷新过程中阻止一切触摸滚动，防止页面状态被破坏
    if (refreshing.value) {
      e.preventDefault()
      return
    }
    if (!isAtTop || startY === null) return

    const delta = e.touches[0].clientY - startY

    // ── 未进入下拉状态：死区内不拦截，交给浏览器正常滚动 ──
    if (!pulling.value) {
      if (delta <= PULL_DEAD_ZONE) return
      // 超过死区，进入下拉刷新模式
      pulling.value = true
    }

    // ── 已在下拉状态：全程阻止页面滚动 ──
    e.preventDefault()

    // 统一使用有效距离（减去死区），保证进入前后公式一致
    const effectiveDelta = delta - PULL_DEAD_ZONE
    if (effectiveDelta <= 0) {
      // 用户向上拖回到死区范围内 → 取消下拉，由 CSS transition 平滑回弹
      pulling.value = false
      startY = null
      isAtTop = false
      return
    }

    pullDistance.value = Math.min(effectiveDelta * 0.5, threshold * 1.4)
  }

  async function handleTouchEnd() {
    if (disabled?.value) {
      resetPullState()
      return
    }
    if (!pulling.value) return
    const triggered = pullDistance.value >= threshold
    if (triggered) {
      pulling.value = false
      pullDistance.value = 0
      refreshing.value = true
      try {
        await onRefresh()
      } finally {
        refreshing.value = false
        pullDistance.value = 0
      }
    } else {
      pulling.value = false
      refreshing.value = false
      pullDistance.value = 0
    }
    startY = null
    isAtTop = false
  }

  return {
    containerRef,
    pulling,
    refreshing,
    pullDistance,
    threshold,
    /** 刷新中为 true，页面应据此禁用容器滚动以避免视觉跳动 */
    scrollDisabled,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
