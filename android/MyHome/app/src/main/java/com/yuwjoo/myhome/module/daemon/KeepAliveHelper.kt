package com.yuwjoo.myhome.module.daemon

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

/**
 * 保活辅助工具
 */
object KeepAliveHelper {

    /**
     * 检查通知权限是否已授予
     *
     * Android 13 以下不需要此权限，始终返回 true
     *
     * @param context 上下文
     * @return true 表示已授予或无需权限
     */
    fun isNotificationGranted(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true
        return ContextCompat.checkSelfPermission(
            context, Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * 创建通知权限请求启动器
     *
     * 必须在 Activity.onCreate 中调用以注册启动器
     *
     * @param activity  当前 Activity
     * @param onGranted 权限授予后的回调
     * @return 权限请求启动器，调用 launch(Manifest.permission.POST_NOTIFICATIONS) 发起请求
     */
    fun createPermissionLauncher(
        activity: ComponentActivity,
        onGranted: () -> Unit,
    ) = activity.registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) onGranted()
    }

    /**
     * 启动保活服务
     *
     * @param context 上下文
     */
    fun start(context: Context) {
        val intent = Intent(context, KeepAliveService::class.java)
        ContextCompat.startForegroundService(context, intent)
    }
}
