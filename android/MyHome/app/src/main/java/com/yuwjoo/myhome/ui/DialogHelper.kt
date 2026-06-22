package com.yuwjoo.myhome.ui

import android.app.Activity
import android.app.AlertDialog
import android.content.DialogInterface
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.ProgressBar
import android.widget.TextView
import java.util.Locale

/**
 * 对话框辅助工具
 *
 * 封装应用内常用的对话框创建逻辑，
 * 提供统一的 UI 风格和回调接口。
 */
object DialogHelper {

    private const val TAG = "DialogHelper"

    /**
     * 显示"发现新版本"更新对话框
     *
     * 当远程版本高于本地版本时弹出，提示用户更新。
     *
     * @param activity 当前 Activity
     * @param newVersion 新版本号
     * @param onConfirm 用户点击"更新"时的回调
     * @param onSkip 用户点击"跳过"时的回调（可选）
     */
    fun showUpdateDialog(
        activity: Activity,
        newVersion: String,
        onConfirm: () -> Unit,
        onSkip: (() -> Unit)? = null
    ) {
        Log.d(TAG, "显示更新对话框，新版本: $newVersion")
        AlertDialog.Builder(activity)
            .setTitle("发现新版本")
            .setMessage("检测到新版本 v$newVersion，是否更新？")
            .setCancelable(false)
            .setPositiveButton("更新") { dialog: DialogInterface, _: Int ->
                Log.d(TAG, "用户确认更新")
                dialog.dismiss()
                onConfirm()
            }
            .setNegativeButton("跳过") { dialog: DialogInterface, _: Int ->
                Log.d(TAG, "用户跳过更新")
                dialog.dismiss()
                onSkip?.invoke()
            }
            .show()
    }

    /**
     * 显示带进度条的下载对话框
     *
     * 首次安装时自动弹出，无需用户确认，直接展示下载进度。
     * 对话框显示进度条和百分比文本，不可取消。
     *
     * @param activity 当前 Activity
     * @param title 对话框标题
     * @return ProgressDialogHandle 用于更新进度和关闭对话框
     */
    fun showProgressDialog(
        activity: Activity,
        title: String = "正在下载资源"
    ): ProgressDialogHandle {
        Log.d(TAG, "显示带进度条的下载对话框")

        // 创建自定义布局：进度条 + 百分比文本
        val layout = android.widget.LinearLayout(activity).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(60, 30, 60, 30)
        }

        val progressBar = ProgressBar(
            activity,
            null,
            android.R.attr.progressBarStyleHorizontal
        ).apply {
            max = 100
            progress = 0
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val progressText = TextView(activity).apply {
            text = "准备下载..."
            textSize = 14f
            setPadding(0, 16, 0, 0)
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        layout.addView(progressBar)
        layout.addView(progressText)

        val dialog = AlertDialog.Builder(activity)
            .setTitle(title)
            .setView(layout)
            .setCancelable(false)
            .show()

        return ProgressDialogHandle(dialog, progressBar, progressText)
    }

    /**
     * 带进度条的对话框句柄
     *
     * 提供更新进度、更新消息和关闭对话框的方法。
     * 所有 UI 操作均自动切换到主线程执行，调用方无需关心线程安全。
     */
    class ProgressDialogHandle(
        private val dialog: AlertDialog,
        private val progressBar: ProgressBar,
        private val progressText: TextView
    ) {
        /** 主线程 Handler，确保 UI 操作在主线程执行 */
        private val mainHandler = Handler(Looper.getMainLooper())

        /**
         * 更新下载进度
         *
         * @param downloaded 已下载字节数
         * @param total 总字节数（-1 表示未知）
         */
        fun updateProgress(downloaded: Long, total: Long) {
            // 如果已在主线程，直接执行；否则 post 到主线程
            val action = {
                if (total > 0) {
                    val percent = (downloaded * 100 / total).toInt().coerceIn(0, 100)
                    progressBar.progress = percent
                    val downloadedMB = downloaded / (1024.0 * 1024.0)
                    val totalMB = total / (1024.0 * 1024.0)
                    progressText.text = String.format(
                        Locale.getDefault(),
                        "%.1f MB / %.1f MB (%d%%)",
                        downloadedMB, totalMB, percent
                    )
                } else {
                    // 总大小未知，仅显示已下载大小
                    val downloadedMB = downloaded / (1024.0 * 1024.0)
                    progressText.text =
                        String.format(Locale.getDefault(), "已下载: %.1f MB", downloadedMB)
                }
            }
            if (Looper.myLooper() == Looper.getMainLooper()) {
                action()
            } else {
                mainHandler.post(action)
            }
        }

        /**
         * 更新提示消息
         */
        fun setMessage(message: String) {
            if (Looper.myLooper() == Looper.getMainLooper()) {
                progressText.text = message
            } else {
                mainHandler.post { progressText.text = message }
            }
        }

        /**
         * 设置进度条为不确定模式（用于解压等无法获知进度的操作）
         */
        fun setIndeterminate() {
            if (Looper.myLooper() == Looper.getMainLooper()) {
                progressBar.isIndeterminate = true
            } else {
                mainHandler.post { progressBar.isIndeterminate = true }
            }
        }

        /**
         * 关闭对话框
         */
        fun dismiss() {
            if (Looper.myLooper() == Looper.getMainLooper()) {
                doDismiss()
            } else {
                mainHandler.post { doDismiss() }
            }
        }

        private fun doDismiss() {
            if (dialog.isShowing) {
                dialog.dismiss()
            }
        }
    }

    /**
     * 显示"错误"提示对话框
     *
     * @param activity 当前 Activity
     * @param message 错误消息
     * @param onDismiss 关闭回调
     */
    fun showErrorDialog(
        activity: Activity,
        message: String,
        onDismiss: (() -> Unit)? = null
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
