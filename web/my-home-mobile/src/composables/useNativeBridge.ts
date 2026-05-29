/**
 * useNativeBridge —— 安全访问 Native 桥接数据（Android / HarmonyOS）
 *
 * Android 端通过 evaluateJavascript 注入 window.__NATIVE__：
 *   { statusBarHeight: number(CSS像素), isAndroid: true }
 *
 * HarmonyOS 端通过 runJavaScript 注入 window.__NATIVE__：
 *   { statusBarHeight: number(CSS像素), isHarmony: true }
 *
 * 注意：Native 端应将状态栏高度转换为 CSS 像素后再传递，
 * 前端直接使用，不再做 dpr 换算。
 */
import { ref, onMounted, onUnmounted } from 'vue'

/** Native 桥接数据声明 */
declare global {
  interface Window {
    __NATIVE__?: {
      statusBarHeight: number
      isAndroid?: boolean
      isHarmony?: boolean
    }
    NativeBridge?: {
      getStatusBarHeight(): number
      isAndroidApp(): boolean
    }
  }
}

/** 是否为 Native App 环境（Android 或 HarmonyOS） */
export function isNativeApp(): boolean {
  if (window.__NATIVE__?.isAndroid || window.__NATIVE__?.isHarmony) return true
  // 备用：调用 Android JS 接口
  try {
    return window.NativeBridge?.isAndroidApp() ?? false
  } catch {
    return false
  }
}

/**
 * 获取状态栏高度（CSS 像素）
 * 直接读取 __NATIVE__.statusBarHeight，Native 端已转为 CSS 像素
 */
export function getStatusBarHeight(): number {
  try {
    if (window.__NATIVE__?.statusBarHeight) {
      return window.__NATIVE__.statusBarHeight
    }
    // 备用：Android JS 接口（返回物理像素需手动换算）
    const raw = window.NativeBridge?.getStatusBarHeight()
    if (raw) {
      const dpr = window.devicePixelRatio || 1
      return Math.round(raw / dpr)
    }
    return 0
  } catch {
    return 0
  }
}

/**
 * 全局使用：监听 Native 桥接就绪，设置 --safe-top CSS 变量
 * 在 App.vue 中调用一次即可
 */
export function useNativeBridge() {
  const safeAreaTop = ref(0)
  const isReady = ref(false)

  function applySafeArea() {
    // 直接检查 __NATIVE__ 而不依赖 isNativeApp()，避免鸡生蛋问题
    if (!window.__NATIVE__) return
    safeAreaTop.value = window.__NATIVE__.statusBarHeight || 0
    isReady.value = true
    document.documentElement.style.setProperty(
      '--safe-top',
      `${safeAreaTop.value}px`,
    )
  }

  // 同步注册事件监听器，避免 onMounted 晚于 nativeBridgeReady 事件
  const handler = () => applySafeArea()
  window.addEventListener('nativeBridgeReady', handler)

  onMounted(() => {
    // 如果 nativeBridgeReady 事件先于 onMounted 触发，
    // __NATIVE__ 已经存在，直接应用
    if (window.__NATIVE__) {
      applySafeArea()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('nativeBridgeReady', handler)
  })

  return {
    /** 是否为 Native App 环境 */
    isNative: isNativeApp,
    /** 安全区域顶部高度（CSS 像素） */
    safeAreaTop,
    /** Native 桥接是否已就绪 */
    isReady,
  }
}
