/**
 * 设备在线状态消息处理
 */
package com.yuwjoo.myhome.modules.bridge.handlers

import com.yuwjoo.myhome.modules.bridge.MessageAction
import com.yuwjoo.myhome.modules.bridge.WebViewHelper
import com.yuwjoo.myhome.modules.devices.deviceStatus.DeviceStatus
import com.yuwjoo.myhome.modules.devices.deviceStatus.DeviceStatusCallback
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
