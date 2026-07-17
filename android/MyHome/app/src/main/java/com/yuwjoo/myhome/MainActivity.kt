package com.yuwjoo.myhome

import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.yuwjoo.myhome.config.AppConfig
import com.yuwjoo.myhome.module.mqtt.MqttManager
import com.yuwjoo.myhome.module.udp.UdpManager
import com.yuwjoo.myhome.module.updater.UpdateListener
import com.yuwjoo.myhome.module.updater.UpdatePlatform
import com.yuwjoo.myhome.module.updater.Updater
import com.yuwjoo.myhome.ui.DialogHelper
import com.yuwjoo.myhome.ui.webview.WebViewManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * 主 Activity
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private val webViewManager by lazy { WebViewManager(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        setContentView(webViewManager.webView)
        setupEdgeToEdgeInsets(webViewManager.webView)

        // 初始化更新器
        Updater.init(this)

        // 加载web
        webViewManager.loadWeb()

        lifecycleScope.launch(Dispatchers.IO) {
            // 连接mqtt
            launch { MqttManager.connect() }
            // 连接udp
            launch { UdpManager.connect(this@MainActivity) }

            if (AppConfig.IS_RELEASE) {
                // 检查更新
                checkUpdate()
                // 更新流程结束后加载 Web 页面
                withContext(Dispatchers.Main) {
                    webViewManager.loadWeb()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()

        lifecycleScope.launch(Dispatchers.IO) {
            // 断开 mqtt
            launch { MqttManager.disconnect() }
            // 断开udp
            launch { UdpManager.disconnect() }
        }
    }

    /**
     * 检查更新
     */
    private suspend fun checkUpdate() {
        Updater.checkUpdate(object : UpdateListener {
            private var progressDialog: DialogHelper.ProgressDialogHandle? = null

            override fun onUpdateAvailable(
                platform: UpdatePlatform,
                version: String,
                onConfirm: () -> Unit,
                onCancel: () -> Unit,
            ) {
                runOnUiThread {
                    when (platform) {
                        UpdatePlatform.APP -> showAppUpdateDialog(version, onConfirm, onCancel)
                        UpdatePlatform.WEB -> startWebUpdateProgress(onConfirm)
                    }
                }
            }

            private fun showAppUpdateDialog(
                version: String,
                onConfirm: () -> Unit,
                onCancel: () -> Unit,
            ) {
                DialogHelper.showUpdateDialog(
                    activity = this@MainActivity,
                    newVersion = version,
                    onConfirm = {
                        progressDialog = DialogHelper.showProgressDialog(
                            this@MainActivity,
                            "正在下载应用更新",
                        )
                        onConfirm()
                    },
                    onSkip = { onCancel() },
                )
            }

            private fun startWebUpdateProgress(onConfirm: () -> Unit) {
                progressDialog = DialogHelper.showProgressDialog(
                    this@MainActivity,
                    "正在更新页面资源",
                )
                onConfirm()
            }

            override fun onUpdateProgress(
                platform: UpdatePlatform,
                downloaded: Long,
                total: Long,
            ) {
                runOnUiThread {
                    progressDialog?.updateProgress(downloaded, total)
                }
            }

            override fun onUpdateComplete(platform: UpdatePlatform) {
                Log.d(TAG, "更新完成: $platform")
                runOnUiThread {
                    progressDialog?.dismiss()
                    progressDialog = null
                }
            }

            override fun onUpdateError(error: String) {
                Log.e(TAG, "更新失败: $error")
                runOnUiThread {
                    progressDialog?.dismiss()
                    progressDialog = null
                    DialogHelper.showErrorDialog(
                        activity = this@MainActivity,
                        message = "检查更新失败",
                    )
                }
            }
        })
    }

    /**
     * 设置边到边安全区 padding
     *
     * @param webView 目标 WebView
     */
    private fun setupEdgeToEdgeInsets(webView: WebView) {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, 0, systemBars.right, systemBars.bottom)
            insets
        }
    }
}
