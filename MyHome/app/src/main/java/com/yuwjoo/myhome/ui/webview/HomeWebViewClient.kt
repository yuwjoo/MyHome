package com.yuwjoo.myhome.ui.webview

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient

class HomeWebViewClient(val context: Context) : WebViewClient() {
    private val FILE_FLAG = "android-file" // 文件链接请求标识

    @SuppressLint("Range")
    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        Log.i(
            "test1",
            (request?.url?.scheme ?: "") + "  " + request?.url?.host + "  " + request?.url?.path
        )
        val host = request?.url?.host
        val path = request?.url?.path
        if (host == FILE_FLAG) {
//                val uri = Uri.parse("content://com.miui.gallery.open/raw//storage/emulated/0/DCIM/Screenshots/Screenshot_2024-02-25-16-05-46-142_com.tencent.tmgp.sgame.jpg")
//                val fileMimeType = context.contentResolver.getType(uri)
//                val fileInputStream = context.contentResolver.openInputStream(uri)

//                val extension = MimeTypeMap.getFileExtensionFromUrl(path)
//                val mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
//                MediaStore.Images.Media.getContentUri(volumeName)
//                return try {
//                    WebResourceResponse(mimeType, "UTF-8",  )
//                } catch ( e: Exception) {
//                    null
//                }


//                val projection = arrayOf(MediaStore.Images.Media.DATA)
//                val cursor: Cursor? = context.getContentResolver().query(
//                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
//                    projection, null, null, null
//                )
//                if (cursor == null) return null
//                var aa: String?
//                while (cursor.moveToNext()) {
//                    aa = cursor.getString(cursor.getColumnIndex(MediaStore.Images.Media.DATA))
//                    // 处理路径
//                }
//                cursor.close()
        }
        return super.shouldInterceptRequest(view, request)
    }
}