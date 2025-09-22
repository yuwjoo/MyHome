package com.yuwjoo.myirrc.activity.main

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.yuwjoo.myirrc.activity.main.ui.RemoteControlButtons
import com.yuwjoo.myirrc.activity.main.ui.theme.MyIRRCTheme
import com.yuwjoo.myirrc.common.UpdateChecker

class MainActivity : ComponentActivity() {
    companion object {
        var activity: MainActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyIRRCTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    RemoteControlButtons(
                        modifier = Modifier.padding(innerPadding),
                        context = this
                    )
                }
            }
        }

        activity = this

        // 检查更新
        UpdateChecker.checkForUpdates(this)
    }
}