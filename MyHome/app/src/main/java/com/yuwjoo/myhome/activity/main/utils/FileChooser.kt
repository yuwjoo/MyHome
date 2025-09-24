package com.yuwjoo.myhome.activity.main.utils

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract

object FileChooser {
    private data class InputData(
        val chooserType: String,
        val fileType: String,
        val isMultiple: Boolean
    )

    private class MyActivityResultContracts : ActivityResultContract<InputData, ArrayList<Uri>>() {

        override fun createIntent(context: Context, input: InputData): Intent {
            when (input.chooserType) {
                // pick选择器
                "pick" -> {
                    val pickIntent = Intent(Intent.ACTION_PICK)
                    pickIntent.type = input.fileType // "image/*" "video/*" "*/*"
                    pickIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, input.isMultiple) // 支持多选
                    return pickIntent
                }
                // content选择器
                "content" -> {
                    val getContentIntent = Intent(Intent.ACTION_GET_CONTENT)
                    getContentIntent.addCategory(Intent.CATEGORY_OPENABLE)
                    getContentIntent.type = input.fileType // "image/*" "video/*" "*/*"
                    getContentIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, input.isMultiple) // 支持多选
                    return getContentIntent
                }
                // document选择器
                "document" -> {
                    val documentIntent = Intent(Intent.ACTION_OPEN_DOCUMENT)
                    documentIntent.type = input.fileType // "image/*" "video/*" "*/*"
                    documentIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, input.isMultiple) // 支持多选
                    return documentIntent
                }
                // 异常情况
                else -> {
                    throw Exception("选择器类型不存在")
                }
            }
        }

        override fun parseResult(resultCode: Int, intent: Intent?): ArrayList<Uri> {
            val uriList = ArrayList<Uri>()
            if (resultCode == Activity.RESULT_OK) {
                // 多选文件
                intent?.clipData?.let {
                    for (i in 0 until it.itemCount) {
                        val item = it.getItemAt(i)
                        item.uri?.let { uriList.add(it) }
                    }
                }
                // 单选文件
                intent?.data?.let {
                    uriList.add(it)
                }
            }
            return uriList
        }
    }

    private var filePickerLauncher: ActivityResultLauncher<InputData>? = null
    private var resultCallback: ActivityResultCallback<ArrayList<Uri>>? = null

    /**
     * 初始化
     * @param activity activity对象
     */
    fun init(activity: ComponentActivity) {
        filePickerLauncher = activity.registerForActivityResult(
            MyActivityResultContracts()
        ) { uriList ->
            resultCallback?.onActivityResult(uriList)
        }
    }

    /**
     * 释放资源
     */
    fun release() {
        filePickerLauncher = null
        resultCallback = null
    }

    /**
     * 打开pick选择器
     * @param fileType 过滤的文件类型
     * @param isMultiple 是否多选
     * @param callback 回调函数
     */
    fun openForPick(
        fileType: String = "*/*",
        isMultiple: Boolean = true,
        callback: ActivityResultCallback<ArrayList<Uri>>
    ) {
        resultCallback = callback
        filePickerLauncher?.launch(InputData("pick", fileType, isMultiple))
    }

    /**
     * 打开content选择器
     * @param fileType 过滤的文件类型
     * @param isMultiple 是否多选
     * @param callback 回调函数
     */
    fun openForContent(
        fileType: String = "*/*",
        isMultiple: Boolean = true,
        callback: ActivityResultCallback<ArrayList<Uri>>
    ) {
        resultCallback = callback
        filePickerLauncher?.launch(InputData("content", fileType, isMultiple))
    }

    /**
     * 打开document选择器
     * @param fileType 过滤的文件类型
     * @param isMultiple 是否多选
     * @param callback 回调函数
     */
    fun openForDocument(
        fileType: String = "*/*",
        isMultiple: Boolean = true,
        callback: ActivityResultCallback<ArrayList<Uri>>
    ) {
        resultCallback = callback
        filePickerLauncher?.launch(InputData("document", fileType, isMultiple))
    }
}