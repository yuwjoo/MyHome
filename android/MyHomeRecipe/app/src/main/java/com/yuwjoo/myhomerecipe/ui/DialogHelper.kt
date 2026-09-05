package com.yuwjoo.myhomerecipe.ui

import android.app.Activity
import android.app.AlertDialog
import android.content.DialogInterface
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import java.util.Locale

/**
 * 对话框辅助工具
 *
 * 封装应用内常用的对话框创建逻辑，提供统一的 UI 风格和回调接口。
 * 所有进度更新类方法内部都会自动切回主线程，调用方无需关心线程。
 */
object DialogHelper {

    private const val TAG = "DialogHelper"

    /**
     * 显示「发现新版本」更新对话框
     *
     * @param activity   当前 Activity
     * @param newVersion 新版本号
     * @param onConfirm  点击「更新」回调
     * @param onSkip     点击「跳过」回调
     */
    fun showUpdateDialog(
        activity: Activity,
        newVersion: String,
        onConfirm: () -> Unit,
        onSkip: (() -> Unit)? = null,
    ) {
        Log.d(TAG, "显示更新对话框，新版本: $newVersion")
        AlertDialog.Builder(activity)
            .setTitle("发现新版本")
            .setMessage("检测到新版本 v$newVersion，是否更新？")
            .setCancelable(false)
            .setPositiveButton("更新") { dialog: DialogInterface, _: Int ->
                dialog.dismiss()
                onConfirm()
            }
            .setNegativeButton("跳过") { dialog: DialogInterface, _: Int ->
                dialog.dismiss()
                onSkip?.invoke()
            }
            .show()
    }

    /**
     * 显示带进度条的对话框
     *
     * @param activity 当前 Activity
     * @param title    对话框标题
     * @return [ProgressDialogHandle]，用于更新进度和关闭对话框
     */
    fun showProgressDialog(
        activity: Activity,
        title: String = "正在下载资源",
    ): ProgressDialogHandle {
        Log.d(TAG, "显示带进度条的对话框: $title")

        val progressBar = ProgressBar(
            activity,
            null,
            android.R.attr.progressBarStyleHorizontal,
        ).apply {
            max = 100
            progress = 0
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            )
        }

        val progressText = TextView(activity).apply {
            text = "准备下载..."
            textSize = 14f
            setPadding(0, 16, 0, 0)
        }

        val layout = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 30, 60, 30)
            addView(progressBar)
            addView(progressText)
        }

        val dialog = AlertDialog.Builder(activity)
            .setTitle(title)
            .setView(layout)
            .setCancelable(false)
            .show()

        return ProgressDialogHandle(dialog, progressBar, progressText)
    }

    /**
     * 带进度条对话框的操作句柄
     */
    class ProgressDialogHandle(
        private val dialog: AlertDialog,
        private val progressBar: ProgressBar,
        private val progressText: TextView,
    ) {
        private val mainHandler = Handler(Looper.getMainLooper())

        /** 更新下载进度（线程安全） */
        fun updateProgress(downloaded: Long, total: Long) {
            onMain {
                if (total > 0) {
                    val percent = (downloaded * 100 / total).toInt().coerceIn(0, 100)
                    progressBar.progress = percent
                    val downloadedMB = downloaded / (1024.0 * 1024.0)
                    val totalMB = total / (1024.0 * 1024.0)
                    progressText.text = String.format(
                        Locale.getDefault(),
                        "%.1f MB / %.1f MB (%d%%)",
                        downloadedMB,
                        totalMB,
                        percent,
                    )
                } else {
                    val downloadedMB = downloaded / (1024.0 * 1024.0)
                    progressText.text =
                        String.format(Locale.getDefault(), "已下载: %.1f MB", downloadedMB)
                }
            }
        }

        /** 更新提示文案（如“正在解压...”，线程安全） */
        fun setMessage(message: String) {
            onMain { progressText.text = message }
        }

        /** 切换为不确定进度（解压等无法显示百分比的阶段，线程安全） */
        fun setIndeterminate() {
            onMain { progressBar.isIndeterminate = true }
        }

        /** 关闭对话框（线程安全） */
        fun dismiss() {
            onMain {
                if (dialog.isShowing) {
                    dialog.dismiss()
                }
            }
        }

        /** 若调用线程即主线程则直接执行，否则投递到主线程 */
        private fun onMain(action: () -> Unit) {
            if (Looper.myLooper() == Looper.getMainLooper()) {
                action()
            } else {
                mainHandler.post(action)
            }
        }
    }

    /**
     * 显示错误提示对话框
     *
     * @param activity 当前 Activity
     * @param message  错误消息
     * @param onDismiss 对话框关闭后的回调（可选）
     */
    fun showErrorDialog(
        activity: Activity,
        message: String,
        onDismiss: (() -> Unit)? = null,
    ) {
        Log.e(TAG, "显示错误对话框: $message")
        AlertDialog.Builder(activity)
            .setTitle("出错了")
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("确定") { dialog: DialogInterface, _: Int ->
                dialog.dismiss()
                onDismiss?.invoke()
            }
            .show()
    }
}
