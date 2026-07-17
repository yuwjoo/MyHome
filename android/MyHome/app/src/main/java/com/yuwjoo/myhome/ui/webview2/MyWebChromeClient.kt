package com.yuwjoo.myhome.ui.webview2

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
    private val activity: ComponentActivity
) : WebChromeClient() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null // 文件选择器回调

    private val filePickerLauncher =
        activity.registerForActivityResult(
            ActivityResultContracts.GetContent()
        ) { uri ->
            filePathCallback?.onReceiveValue(uri?.let { arrayOf(it) })
            filePathCallback = null
        }

    /**
     * 显示文件选择器
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
