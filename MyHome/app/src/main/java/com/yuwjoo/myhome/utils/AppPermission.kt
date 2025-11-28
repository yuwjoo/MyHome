package com.yuwjoo.myhome.utils

import android.Manifest
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts

/**
 * 应用权限
 */
class AppPermission(activity: ComponentActivity) {
    private var permissionLauncher: ActivityResultLauncher<String>? = null
    private var resultCallback: ActivityResultCallback<Boolean>? = null
    private var multiplePermissionsLauncher: ActivityResultLauncher<Array<String>>? = null
    private var multiplePermissionsResultCallback: ActivityResultCallback<Map<String, Boolean>>? =
        null

    init {
        permissionLauncher = activity.registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { isGranted ->
            resultCallback?.onActivityResult(isGranted)
        }

        multiplePermissionsLauncher = activity.registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            multiplePermissionsResultCallback?.onActivityResult(permissions)
        }

        // 请求初始需要的权限
        requestPermissions(
            arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        )
    }

    /**
     * 请求权限
     * @param permission 权限名称
     * @param callback 回调函数
     */
    fun requestPermission(permission: String, callback: ActivityResultCallback<Boolean>? = null) {
        resultCallback = callback
        permissionLauncher?.launch(permission)
    }

    /**
     * 请求多个权限
     * @param permissions 权限名称数组
     * @param callback 回调函数
     */
    fun requestPermissions(
        permissions: Array<String>,
        callback: ActivityResultCallback<Map<String, Boolean>>? = null
    ) {
        multiplePermissionsResultCallback = callback
        multiplePermissionsLauncher?.launch(permissions)
    }
}