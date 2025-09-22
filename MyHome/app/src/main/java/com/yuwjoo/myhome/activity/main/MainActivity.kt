package com.yuwjoo.myhome.activity.main

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.yuwjoo.myhome.common.telecontrol.MQTTTelecontrol
import com.yuwjoo.myhome.activity.main.ui.theme.MyHomeTheme
import com.yuwjoo.myhome.activity.main.ui.webview.WebViewRender
import com.yuwjoo.myhome.common.UpdateChecker
import com.yuwjoo.myhome.common.telecontrol.SocketTelecontrol
import com.yuwjoo.myhome.common.telecontrol.UDPTelecontrol

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyHomeTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    WebViewRender(
                        activity = this,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }

        // 检查更新
        UpdateChecker.checkForUpdates(this)

        // 查找控制设备
        UDPTelecontrol.scanServerDevices()
        // 连接mqtt
        MQTTTelecontrol.getInstance().connect()
    }

    override fun onResume() {
        super.onResume()
        UDPTelecontrol.serverIP = null
        SocketTelecontrol.getInstance().disconnect()
        if (!MQTTTelecontrol.getInstance().isConnected()) {
            // 连接mqtt
            MQTTTelecontrol.getInstance().connect()
        }
        if (!SocketTelecontrol.getInstance().isConnected()) {
            // 连接socket
            SocketTelecontrol.getInstance().connect()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        MQTTTelecontrol.getInstance().disconnect()
    }
}