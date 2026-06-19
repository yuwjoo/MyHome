package com.yuwjoo.myhomeserver

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.yuwjoo.myhomeserver.modules.live.LiveStreamCallback
import com.yuwjoo.myhomeserver.modules.live.LiveStreamManager
import com.yuwjoo.myhomeserver.modules.live.LiveStreamState

/**
 * 主 Activity
 *
 * 承载摄像头预览画面，并通过 [LiveStreamManager] 管理推流生命周期。
 *
 * ### 页面布局
 * - PreviewView：摄像头实时预览
 * - tvStatus：推流状态文字
 * - tvSegments：已上传分段数
 *
 * ### 推流控制
 * 推流的 start/stop 由远程 MQTT 指令驱动（`YHHome/live/command`），
 * Activity 只负责展示预览画面和推流状态。
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private lateinit var liveManager: LiveStreamManager
    private lateinit var previewView: PreviewView
    private lateinit var tvStatus: TextView
    private lateinit var tvSegments: TextView

    // Android 13+ 通知权限请求
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        Log.d(TAG, "通知权限: ${if (granted) "已授权" else "已拒绝"}")
    }

    // ════════════════ 生命周期 ════════════════

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        previewView = findViewById(R.id.previewView)
        tvStatus = findViewById(R.id.tvStatus)
        tvSegments = findViewById(R.id.tvSegments)

        // 请求通知权限（Android 13+ 前台服务必需）
        requestNotificationPermission()

        // 请求摄像头权限
        requestCameraPermission()

        liveManager = LiveStreamManager.getInstance()

        // 将预览 Surface 交给 LiveStreamManager 管理
        liveManager.init(
            context = this,
            lifecycleOwner = this,
            surfaceProvider = previewView.surfaceProvider,
        )

        // 注册状态回调
        liveManager.addCallback(object : LiveStreamCallback {
            override fun onStateChanged(state: LiveStreamState) {
                runOnUiThread {
                    tvStatus.text = "状态: ${state.status.name}"
                    tvSegments.text = "已上传: ${state.uploadedSegments} 段"
                    Log.d(TAG, "推流状态: $state")
                }
            }

            override fun onSegmentUploaded(segmentName: String) {
                Log.d(TAG, "分段已上传: $segmentName")
            }

            override fun onError(error: Exception) {
                runOnUiThread {
                    tvStatus.text = "错误: ${error.message}"
                }
                Log.e(TAG, "推流错误", error)
            }
        })
    }

    override fun onDestroy() {
        liveManager.stopStream()
        super.onDestroy()
    }

    // ════════════════ 权限 ════════════════

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS,
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun requestCameraPermission() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA,
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(
                arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO),
                100,
            )
        }
    }
}
