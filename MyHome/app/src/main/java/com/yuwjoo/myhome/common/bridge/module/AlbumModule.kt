package com.yuwjoo.myhome.common.bridge.module

import android.net.Uri
import com.yuwjoo.myhome.MainActivity
import com.yuwjoo.myhome.common.bridge.BridgeConstant
import com.yuwjoo.myhome.common.bridge.core.WebViewBridge

/**
 * 相册模块
 */
object AlbumModule {

    private val tempFileUris = HashMap<String, Uri>() // 临时文件uri集合

    /**
     * 初始化
     * @param bridge web桥对象
     */
    fun init(bridge: WebViewBridge) {
        bridge.apply {
            // 选择文件
            router.register<Any?>(BridgeConstant.API_ALBUM_PICK_FILE) { _, channel ->
                MainActivity.instance?.apply {
                    fileChooser.openForPick("image/*, video/*") { uris ->
                        uris.forEach { tempFileUris[it.toString()] = it }
                        channel.done(payload = uris)
                    }
                } ?: channel.done()
            }
            // 保存相册
            router.register<Any?>(BridgeConstant.API_ALBUM_SAVE_ALBUM) { _, channel ->
                // 数据库插入操作
                tempFileUris.clear()
                channel.done()
            }
        }
    }

    /**
     * 获取临时文件uri
     * @param key 映射key值
     * @return 文件uri
     */
    fun getTempFileUri(key: String): Uri? {
        return tempFileUris[key]
    }
}