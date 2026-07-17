package com.yuwjoo.myhome.ui.webview

import android.net.Uri
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts

/**
 * WebView Chrome 客户端
 */
class MyWebChromeClient(
    private val activity: ComponentActivity // Activity 实例
) : WebChromeClient() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null // 文件选择器回调

    private val filePickerLauncher =
        activity.registerForActivityResult(
            ActivityResultContracts.GetContent()
        ) { uri -> // 文件选择结果处理
            filePathCallback?.onReceiveValue(uri?.let { arrayOf(it) })
            filePathCallback = null
        }

    /**
     * 打开文件选择器
     *
     * @param webView  WebView 实例
     * @param callback 选择结果回调
     * @param params   文件选择器参数
     * @return 始终返回 true，表示已接管文件选择
     */
    override fun onShowFileChooser(
        webView: WebView?,
        callback: ValueCallback<Array<Uri>>?,
        params: FileChooserParams?
    ): Boolean {
        filePathCallback = callback
        filePickerLauncher.launch("*/*")
        return true
    }
}
