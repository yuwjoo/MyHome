package com.yuwjoo.myhome.common.device.bedroomAC

import com.yuwjoo.myhome.common.topic.payload.DataBedroomACPayload

fun interface ACStateCallback {
    /**
     * 空调状态发生变化
     * @param state 最新的完整状态
     */
    fun onStateChanged(state: DataBedroomACPayload)
}
