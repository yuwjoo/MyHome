package com.yuwjoo.myirrc.activity.main.ui

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.yuwjoo.myirrc.service.ForegroundService
import com.yuwjoo.myirrc.common.telecontrol.SocketTelecontrolServer

/**
 * 遥控器控制面板组件
 */
@Composable
fun RemoteControlButtons(modifier: Modifier = Modifier, context: Context) {
    Column(
        modifier = modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(onClick = {
            SocketTelecontrolServer.getInstance().startServer()
            Toast.makeText(context, "Socket服务已启动，监听端口30000", Toast.LENGTH_SHORT).show()
        }) {
            Text(text = "启动Socket服务")
        }

        Button(onClick = {
            SocketTelecontrolServer.getInstance().stopServer()
            Toast.makeText(context, "Socket服务已停止", Toast.LENGTH_SHORT).show()
        }) {
            Text(text = "停止Socket服务")
        }

        Button(onClick = {
            val clientCount = SocketTelecontrolServer.getInstance().getConnectedClientsCount()
            Toast.makeText(context, "当前连接客户端数: $clientCount", Toast.LENGTH_SHORT).show()
        }) {
            Text(text = "查看连接数")
        }

        Button(onClick = {
            SocketTelecontrolServer.getInstance().sendMessageToAll("来自服务器的广播消息")
            Toast.makeText(context, "已发送广播消息", Toast.LENGTH_SHORT).show()
        }) {
            Text(text = "发送广播消息")
        }

        Button(onClick = {
            ForegroundService.stopService(context)
        }) {
            Text(text = "退出前台")
        }
    }
}