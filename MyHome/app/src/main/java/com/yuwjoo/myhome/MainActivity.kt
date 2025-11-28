package com.yuwjoo.myhome

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.yuwjoo.myhome.utils.FileChooser
import com.yuwjoo.myhome.ui.theme.MyHomeTheme
import com.yuwjoo.myhome.ui.webview.HomeWebView
import com.yuwjoo.myhome.utils.AppPermission
import com.yuwjoo.myhome.utils.UpdateChecker
import com.yuwjoo.myhome.feature.telecontrol.Telecontrol
import com.yuwjoo.myhome.ui.webview.MyHomeWebView
import com.yuwjoo.myhome.ui.webview.myHomeWebView

class MainActivity : ComponentActivity() {

    companion object {
        lateinit var instance: MainActivity private set
    }

    lateinit var homeWebView: HomeWebView private set // webview
    lateinit var fileChooser: FileChooser private set // 文件选择器
    lateinit var appPermission: AppPermission private set // 应用权限

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyHomeTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    MyHomeWebView(
                        this,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }

        instance = this

        UpdateChecker.checkForUpdates(this) // 检查更新
        homeWebView = myHomeWebView!! // webview
        fileChooser = FileChooser(this) // 文件选择器
        appPermission = AppPermission(this) // 应用权限
        Telecontrol.start() // 启动遥控
    }

    override fun onResume() {
        super.onResume()

        Telecontrol.start() // 启动遥控
    }

    override fun onDestroy() {
        super.onDestroy()

        Telecontrol.close() // 关闭遥控
    }
}