package com.yuwjoo.myhome.activity.main.utils

import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts

object AppPermission {
    private var permissionLauncher: ActivityResultLauncher<String>? = null
    private var resultCallback: ActivityResultCallback<Boolean>? = null
    private var multiplePermissionsLauncher: ActivityResultLauncher<Array<String>>? = null
    private var multiplePermissionsResultCallback: ActivityResultCallback<Map<String, Boolean>>? =
        null

    /**
     * 初始化
     * @param activity activity对象
     */
    fun init(activity: ComponentActivity) {
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
    }

    /**
     * 释放资源
     */
    fun release() {
        permissionLauncher = null
        resultCallback = null
        multiplePermissionsLauncher = null
        multiplePermissionsResultCallback = null
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