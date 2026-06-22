/**
 * 设备在线状态消息处理
 */
package com.yuwjoo.myhome.module.bridge.handlers

import com.yuwjoo.myhome.module.bridge.MessageAction
import com.yuwjoo.myhome.module.bridge.WebViewHelper
import com.yuwjoo.myhome.module.device.deviceStatus.DeviceStatus
import com.yuwjoo.myhome.module.device.deviceStatus.DeviceStatusCallback
import org.json.JSONObject

class DeviceStatusAction : MessageAction {
    override val name = "deviceStatus"

    private var statusCallback: DeviceStatusCallback? = null

    override fun execute(params: JSONObject, groupId: String?, helper: WebViewHelper) {
        val action = params.getString("action")
        val ds = DeviceStatus.getInstance()

        when (action) {
            "getStatus" -> {
                helper.invokeCallback(groupId, "onStatus", statusToJson(ds.currentStatus))
            }
            "subscribeStatus" -> {
                if (statusCallback == null) {
                    statusCallback = DeviceStatusCallback { status ->
                        helper.pushEvent("onDeviceStatusChanged", statusToJson(status))
                    }
                    ds.addCallback(statusCallback!!)
                }
            }
            "unsubscribeStatus" -> {
                statusCallback?.let { ds.removeCallback(it) }
                statusCallback = null
            }
        }
    }

    private fun statusToJson(status: String): JSONObject {
        return JSONObject().apply {
            put("status", status)
        }
    }
}
