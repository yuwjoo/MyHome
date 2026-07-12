package com.yuwjoo.myhome

import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.yuwjoo.myhome.module.mqtt.MqttManager
import com.yuwjoo.myhome.module.udp.UdpManager
import com.yuwjoo.myhome.ui.webview.WebViewManager

/**
 * 主 Activity
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webViewManager: WebViewManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        WebView.setWebContentsDebuggingEnabled(true)

        webViewManager = WebViewManager(this, lifecycleScope)
        setContentView(webViewManager.webView)
        setupEdgeToEdgeInsets(webViewManager.webView)
        onBackPressedDispatcher.addCallback(this, webViewManager.backPressCallback)
        webViewManager.initializeResources()
        Thread { MqttManager.connect() }.start() // 建立 MQTT 连接
        Thread { UdpManager.connect(this) }.start() // 加入组播组
    }

    override fun onDestroy() {
        super.onDestroy()
        Thread { MqttManager.disconnect() }.start() // 断开 MQTT 连接
        Thread { UdpManager.disconnect() }.start() // 离开组播组
    }

    override fun onResume() {
        super.onResume()
    }

    private fun setupEdgeToEdgeInsets(webView: WebView) {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, 0, systemBars.right, systemBars.bottom)
            insets
        }
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}
