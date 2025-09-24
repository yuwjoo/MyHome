package com.yuwjoo.myhome.activity.main

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.yuwjoo.myhome.activity.main.utils.FileChooser
import com.yuwjoo.myhome.common.telecontrol.MQTTTelecontrol
import com.yuwjoo.myhome.activity.main.ui.theme.MyHomeTheme
import com.yuwjoo.myhome.activity.main.ui.webview.WebViewRender
import com.yuwjoo.myhome.activity.main.utils.AppPermission
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

        // 初始化文件选择器模块
        FileChooser.init(this)
        // 初始化应用权限请求模块
        AppPermission.init(this)

        // 查找控制设备
        UDPTelecontrol.scanServerDevices()
        // 连接mqtt
        MQTTTelecontrol.getInstance().connect()

        // 请求权限
        requestPermissions()
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
        // 释放文件选择器模块
        FileChooser.release()
        // 释放应用权限请求模块
        AppPermission.release()

        MQTTTelecontrol.getInstance().disconnect()
    }

    /**
     * 请求权限
     */
    private fun requestPermissions() {
        AppPermission.requestPermissions(
            arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        )
    }
}