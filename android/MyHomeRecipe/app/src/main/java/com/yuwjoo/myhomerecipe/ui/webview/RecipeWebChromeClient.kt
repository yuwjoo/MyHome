package com.yuwjoo.myhomerecipe.ui.webview

import android.net.Uri
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts

/**
 * WebView Chrome 客户端
 *
 * 主要处理 <input type="file"> 的文件选择：
 * 使用系统文档选择器接管，支持按页面声明的 accept 类型过滤，
 * 并区分单选 / 多选。
 */
class RecipeWebChromeClient(
    private val activity: ComponentActivity,
) : WebChromeClient() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    /** 单选文件选择器 */
    private val singlePickerLauncher =
        activity.registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            filePathCallback?.onReceiveValue(uri?.let { arrayOf(it) })
            filePathCallback = null
        }

    /** 多选文件选择器（页面声明 accept="multiple" 时使用） */
    private val multiplePickerLauncher =
        activity.registerForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
            filePathCallback?.onReceiveValue(uris.toTypedArray())
            filePathCallback = null
        }

    /**
     * 打开文件选择器
     *
     * @return 始终返回 true，表示文件选择已由本客户端接管
     */
    override fun onShowFileChooser(
        webView: WebView?,
        callback: ValueCallback<Array<Uri>>?,
        params: FileChooserParams?,
    ): Boolean {
        // 页面可能连续触发选择，先取消上一次未完成的回调
        filePathCallback?.onReceiveValue(null)
        filePathCallback = callback

        val mimeType = params?.acceptTypes?.firstOrNull { it.isNotBlank() } ?: "*/*"

        if (params?.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {
            multiplePickerLauncher.launch(mimeType)
        } else {
            singlePickerLauncher.launch(mimeType)
        }
        return true
    }
}
