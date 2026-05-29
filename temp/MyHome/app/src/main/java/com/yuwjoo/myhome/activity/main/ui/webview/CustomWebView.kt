package com.yuwjoo.myhome.activity.main.ui.webview

import android.annotation.SuppressLint
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import android.webkit.MimeTypeMap
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import com.yuwjoo.myhome.activity.main.utils.FileChooser
import com.yuwjoo.myhome.common.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.utils.webviewbridge.WebViewBridge
import java.io.File


@SuppressLint("SetJavaScriptEnabled")
class CustomWebView(context: Context) : WebView(context) {

    private class MyWebViewClient(val context: Context) : WebViewClient() {
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

    private class MyWebChromeClient(val context: Context) : WebChromeClient() {

        override fun onShowFileChooser(
            webView: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
        ): Boolean {
            val fileType = fileChooserParams?.acceptTypes?.joinToString(", ") ?: "*/*"
            val isMultiple = fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE
            FileChooser.openForPick(fileType.ifEmpty { "*/*" }, isMultiple) { uriList ->
//                val uri = uriList.get(0)
//                val str = uri.toString()
//                val fileMimeType = context.contentResolver.getType(uri)
//                val fileInputStream = context.contentResolver.openInputStream(uri)
                filePathCallback?.onReceiveValue(uriList.toTypedArray())
            }
            return true
        }
    }

    val bridge: WebViewBridge = WebViewBridge(this) // web通信桥

    init {
        bridge.apply {
            // 空调红外控制相关API
            router.register(BridgeConstant.API_BEDROOM_AC_TOGGLE_POWER, BedroomAC::togglePower)
            router.register(
                BridgeConstant.API_BEDROOM_AC_INCREASE_TEMPERATURE,
                BedroomAC::increaseTemperature
            )
            router.register(
                BridgeConstant.API_BEDROOM_AC_DECREASE_TEMPERATURE,
                BedroomAC::decreaseTemperature
            )
            router.register(BridgeConstant.API_BEDROOM_AC_TOGGLE_SWING, BedroomAC::toggleSwing)
            router.register(
                BridgeConstant.API_BEDROOM_AC_SET_COOLING_MODE,
                BedroomAC::setCoolingMode
            )
            router.register(
                BridgeConstant.API_BEDROOM_AC_SET_HEATING_MODE,
                BedroomAC::setHeatingMode
            )
            router.register(
                BridgeConstant.API_BEDROOM_AC_TOGGLE_WIND_SPEED,
                BedroomAC::toggleWindSpeed
            )
            router.register(
                BridgeConstant.API_BEDROOM_AC_ENABLE_GENTLE_MODE,
                BedroomAC::enableGentleMode
            )
            router.register(
                BridgeConstant.API_BEDROOM_AC_TOGGLE_SLEEP_MODE,
                BedroomAC::toggleSleepMode
            )
            router.register(BridgeConstant.API_BEDROOM_AC_SET_TIMING, BedroomAC::setTiming)
            router.register(BridgeConstant.API_BEDROOM_AC_CANCEL_TIMING, BedroomAC::cancelTiming)
            router.register(BridgeConstant.API_BEDROOM_AC_GET_AC_STATE, BedroomAC::getACState)
            router.register(BridgeConstant.API_BEDROOM_AC_GET_MQTT_STATE, BedroomAC::getMQTTState)
            router.register(
                BridgeConstant.API_BEDROOM_AC_GET_SOCKET_STATE,
                BedroomAC::getSocketState
            )
        }

        settings.javaScriptEnabled = true // 启用javaScript
        settings.domStorageEnabled = true // 启动存储
        settings.allowFileAccess = true // 允许访问文件
        settings.allowContentAccess = true // 允许访问内容

        webViewClient = MyWebViewClient(context)
        webChromeClient = MyWebChromeClient(context)
    }
}