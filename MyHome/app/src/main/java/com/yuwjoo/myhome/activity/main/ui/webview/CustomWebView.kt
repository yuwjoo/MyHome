package com.yuwjoo.myhome.activity.main.ui.webview

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.ComponentActivity
import com.yuwjoo.myhome.common.telecontrol.devices.BedroomAC
import com.yuwjoo.myhome.utils.webviewbridge.WebViewBridge

@SuppressLint("SetJavaScriptEnabled")
class CustomWebView(context: Context) : WebView(context) {
    val bridge: WebViewBridge = WebViewBridge(this) // web连接桥

    init {
        bridge.apply {
            // 空调红外控制相关API
            router.register(BridgeConstant.API_BEDROOM_AC_TOGGLE_POWER, BedroomAC::togglePower)
            router.register(BridgeConstant.API_BEDROOM_AC_INCREASE_TEMPERATURE, BedroomAC::increaseTemperature)
            router.register(BridgeConstant.API_BEDROOM_AC_DECREASE_TEMPERATURE, BedroomAC::decreaseTemperature)
            router.register(BridgeConstant.API_BEDROOM_AC_TOGGLE_SWING, BedroomAC::toggleSwing)
            router.register(BridgeConstant.API_BEDROOM_AC_SET_COOLING_MODE, BedroomAC::setCoolingMode)
            router.register(BridgeConstant.API_BEDROOM_AC_SET_HEATING_MODE, BedroomAC::setHeatingMode)
            router.register(BridgeConstant.API_BEDROOM_AC_TOGGLE_WIND_SPEED, BedroomAC::toggleWindSpeed)
            router.register(BridgeConstant.API_BEDROOM_AC_ENABLE_GENTLE_MODE, BedroomAC::enableGentleMode)
            router.register(BridgeConstant.API_BEDROOM_AC_TOGGLE_SLEEP_MODE, BedroomAC::toggleSleepMode)
            router.register(BridgeConstant.API_BEDROOM_AC_SET_TIMING, BedroomAC::setTiming)
            router.register(BridgeConstant.API_BEDROOM_AC_CANCEL_TIMING, BedroomAC::cancelTiming)
            router.register(BridgeConstant.API_BEDROOM_AC_GET_AC_STATE, BedroomAC::getACState)
            router.register(BridgeConstant.API_BEDROOM_AC_GET_MQTT_STATE, BedroomAC::getMQTTState)
            router.register(BridgeConstant.API_BEDROOM_AC_GET_SOCKET_STATE, BedroomAC::getSocketState)
        }

        settings.javaScriptEnabled = true // 启用javaScript
        settings.domStorageEnabled = true // 启动存储
        settings.allowFileAccess = true // 允许访问文件

        webChromeClient = (object : WebChromeClient() {

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                val contentIntent = Intent(Intent.ACTION_OPEN_DOCUMENT)
                contentIntent.addCategory(Intent.CATEGORY_OPENABLE)
//                contentIntent.putExtra(
//                    Intent.EXTRA_ALLOW_MULTIPLE,
//                    true
//                )

                val chooserIntent = Intent(Intent.ACTION_CHOOSER)
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "选择操作")
                (context as ComponentActivity).startActivityForResult(contentIntent, 111)

                return true
            }
        })
    }
}