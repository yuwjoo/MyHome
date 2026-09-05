package com.yuwjoo.myhomerecipe.ui.webview

import android.annotation.SuppressLint
import android.util.Log
import android.webkit.WebView
import androidx.core.view.WindowInsetsCompat
import kotlin.math.roundToInt

/**
 * 系统栏 inset 桥：把原生真实 inset（已换算为 CSS px = dp）注入页面根节点上的
 * --safe-top / --safe-right / --safe-bottom / --safe-left。
 *
 * 设计原则：视觉布局完全由 Web 端 CSS 控制（背景延伸到系统栏下方、内容按安全区
 * 变量让位），壳层只负责提供设备真实数值。
 *
 * 为什么要这样做：Android WebView 不保证 env(safe-area-inset-*) 有值（实测为 0），
 * 若用原生 setPadding 硬垫，又会在顶部产生白条、且与 Web 端自身安全区处理叠加。
 * 因此统一改为「原生量尺寸 → Web 变量让位」的单一路径；
 * iOS / 桌面浏览器无外壳时，Web 端 :root 里的 env() 兜底依然生效。
 */
class SafeAreaBridge(private val webView: WebView) {

    /** 换算后的安全区（单位：CSS px = dp） */
    private data class Insets(
        val top: Int,
        val right: Int,
        val bottom: Int,
        val left: Int,
    )

    private var lastInsets: Insets? = null

    /** 页面主文档是否已就绪（就绪前注入会失败，需等 onPageFinished 回放） */
    private var pageReady = false

    /** 由 WindowInsets 监听器调用：记录最新 inset 并尝试注入 */
    fun onSystemBarInsetsChanged(insets: WindowInsetsCompat) {
        val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        val density = webView.resources.displayMetrics.density
        lastInsets = Insets(
            top = (systemBars.top / density).roundToInt(),
            right = (systemBars.right / density).roundToInt(),
            bottom = (systemBars.bottom / density).roundToInt(),
            left = (systemBars.left / density).roundToInt(),
        )
        inject()
    }

    /** 页面主文档加载完成后调用：回放最新 inset（首次注入若发生在 DOM 就绪前会失败） */
    fun onPageReady() {
        pageReady = true
        inject()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun inject() {
        val v = lastInsets ?: return
        if (!pageReady) return

        val script = buildString {
            append("(function(){var s=document.documentElement.style;")
            append("s.setProperty('--safe-top','${v.top}px');")
            append("s.setProperty('--safe-right','${v.right}px');")
            append("s.setProperty('--safe-bottom','${v.bottom}px');")
            append("s.setProperty('--safe-left','${v.left}px');")
            append("})();")
        }

        // 回调均在主线程，这里再 post 一次以确保 WebView 状态安全
        webView.post {
            try {
                webView.evaluateJavascript(script, null)
            } catch (e: Exception) {
                Log.w(TAG, "安全区 inset 注入失败: $script", e)
            }
        }
    }

    companion object {
        private const val TAG = "SafeAreaBridge"
    }
}
