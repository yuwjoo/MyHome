package com.yuwjoo.myhomerecipe

import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import com.yuwjoo.myhomerecipe.config.AppConfig
import com.yuwjoo.myhomerecipe.module.updater.UpdateListener
import com.yuwjoo.myhomerecipe.module.updater.UpdatePlatform
import com.yuwjoo.myhomerecipe.module.updater.Updater
import com.yuwjoo.myhomerecipe.ui.DialogHelper
import com.yuwjoo.myhomerecipe.ui.webview.SafeAreaBridge
import com.yuwjoo.myhomerecipe.ui.webview.WebViewManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * 主 Activity
 *
 * 页面 UI 全部由 WebView 承载，本类只负责三件事：
 * 1. 初始化更新器（含首次占位页植入），创建并加载 WebView；
 * 2. 正式环境下在后台检查更新，完成后自动刷新页面；
 * 3. 把更新进度 / 确认 / 错误等交互通过 DialogHelper 呈现给用户。
 */
class MainActivity : ComponentActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private val webViewManager by lazy { WebViewManager(this) }

    /** 系统栏 inset → Web CSS 变量桥（尺寸由原生提供，布局交给页面 CSS） */
    private val safeAreaBridge by lazy { SafeAreaBridge(webViewManager.webView) }

    /** UI 编排协程作用域：主线程派发，内部 IO 由更新模块自行切换 */
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private var progressDialog: DialogHelper.ProgressDialogHandle? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 必须在 loadWeb 之前初始化：正式环境首次安装时会把内置占位页植入本地资源目录
        Updater.init(applicationContext)

        setContentView(webViewManager.webView)
        setupSystemBarInsets(webViewManager.webView)
        // 文档加载完成后回放安全区 inset（SPA 路由切换不重新加载文档，仅需在此注入）
        webViewManager.onPageLoaded { safeAreaBridge.onPageReady() }

        // 先加载本地资源（正式环境首启可能先展示占位页），再在后台检查更新
        webViewManager.loadWeb()

        if (AppConfig.IS_RELEASE) {
            scope.launch { checkAndUpdate() }
        }
    }

    override fun onDestroy() {
        scope.cancel()
        progressDialog?.dismiss()
        progressDialog = null
        super.onDestroy()
    }

    /**
     * 检查更新并在结束后尝试加载最新资源：
     * - 有更新：版本号变化，[webViewManager.loadWeb] 会强制重新加载；
     * - 无更新：版本未变化，loadWeb 内部会自动跳过，不会重复加载。
     */
    private suspend fun checkAndUpdate() {
        Log.d(TAG, "开始检查更新")
        Updater.checkUpdate(updateListener)
        webViewManager.loadWeb()
        Log.d(TAG, "检查更新流程结束")
    }

    /** 更新交互回调：弹窗、进度、错误提示 */
    private val updateListener = object : UpdateListener {

        override fun onUpdateAvailable(
            platform: UpdatePlatform,
            version: String,
            onConfirm: () -> Unit,
            onCancel: () -> Unit,
        ) {
            when (platform) {
                // Web 资源升级为静默策略：无需确认，展示下载进度
                UpdatePlatform.WEB -> {
                    progressDialog = DialogHelper.showProgressDialog(
                        this@MainActivity,
                        "正在更新页面资源",
                    )
                    onConfirm()
                }

                // App 升级需要用户确认
                UpdatePlatform.APP -> showAppUpdateDialog(version, onConfirm, onCancel)
            }
        }

        override fun onUpdateProgress(platform: UpdatePlatform, downloaded: Long, total: Long) {
            progressDialog?.updateProgress(downloaded, total)
        }

        override fun onUpdateComplete(platform: UpdatePlatform) {
            Log.d(TAG, "更新完成: $platform")
            progressDialog?.dismiss()
            progressDialog = null
        }

        override fun onUpdateError(error: String, platform: UpdatePlatform?) {
            Log.e(TAG, "更新出错: $error")
            progressDialog?.dismiss()
            progressDialog = null

            // 检查更新 / Web 资源更新都属于后台静默流程：本地已有可用的正式页面时
            // 失败不打扰用户（离线或网络不可达的冷启动很常见，直接沿用本地资源）；
            // 仅当仍停留在内置占位页（页面从未下载成功）或 App 更新（用户已确认）失败时弹窗。
            if (platform != UpdatePlatform.APP && Updater.hasUsableWebResource) {
                Log.w(TAG, "后台更新失败（静默降级，继续使用本地资源）: $error")
                return
            }
            DialogHelper.showErrorDialog(this@MainActivity, error)
        }
    }

    /** 应用更新：先弹确认框，确认后展示下载进度并开始下载 */
    private fun showAppUpdateDialog(
        version: String,
        onConfirm: () -> Unit,
        onCancel: () -> Unit,
    ) {
        DialogHelper.showUpdateDialog(
            activity = this,
            newVersion = version,
            onConfirm = {
                progressDialog = DialogHelper.showProgressDialog(this, "正在下载应用更新")
                onConfirm()
            },
            onSkip = { onCancel() },
        )
    }

    /**
     * 边到边适配：把系统栏真实 inset 提供给 Web 页面。
     *
     * 采用「原生量尺寸 → Web 变量让位」的方案，而不是给 WebView 加 padding：
     * 1. Android WebView 不保证 env(safe-area-inset-*) 有值（实测为 0），
     *    页面拿不到真实系统栏尺寸，内容会顶进状态栏/手势条下面；
     * 2. 原生 padding 硬垫会在顶部露出无法被页面背景覆盖的白条，并可能与页面
     *    自身的安全区处理叠加成双倍留白。
     *
     * 因此这里只负责把 inset 换算成 CSS px（= dp）后注入页面根节点的
     * --safe-top / --safe-right / --safe-bottom / --safe-left，
     * 背景铺满与内容让位全部由页面 CSS 控制。
     */
    private fun setupSystemBarInsets(webView: WebView) {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { _, insets ->
            safeAreaBridge.onSystemBarInsetsChanged(insets)
            insets
        }
        // 强制触发一次 inset 分发：监听器挂载晚于首次分发时会漏收
        ViewCompat.requestApplyInsets(webView)
    }
}
