package com.yuwjoo.myhome.ui.webview

import android.content.Context
import android.net.Uri
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import com.yuwjoo.myhome.MainActivity

class HomeWebChromeClient(val context: Context) : WebChromeClient() {

    override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
    ): Boolean {
        val fileType = fileChooserParams?.acceptTypes?.joinToString(", ") ?: "*/*"
        val isMultiple = fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE
        MainActivity.instance?.apply {
            fileChooser.openForPick(fileType.ifEmpty { "*/*" }, isMultiple) { uriList ->
//                val uri = uriList.get(0)
//                val str = uri.toString()
//                val fileMimeType = context.contentResolver.getType(uri)
//                val fileInputStream = context.contentResolver.openInputStream(uri)
                filePathCallback?.onReceiveValue(uriList.toTypedArray())
            }
        }

        return true
    }
}