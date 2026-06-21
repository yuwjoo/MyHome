package com.yuwjoo.myhome

import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.yuwjoo.myhome.modules.mqtt.MqttManager
import com.yuwjoo.myhome.webview.WebViewManager

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
    }

    override fun onResume() {
        super.onResume()
       reconnectMqttIfNeeded()
    }

    /**
     * 从后台回到前台时，如果 MQTT 连接已断开则重新连接
     */
    private fun reconnectMqttIfNeeded() {
        val manager = MqttManager.getInstance()
        if (!manager.isConnected) {
            Log.d(TAG, "MQTT 连接已断开，正在重新连接...")
            manager.connect()
        }
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
