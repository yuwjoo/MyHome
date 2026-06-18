package com.yuwjoo.myhome.modules.设备.bedroomAC

interface ACStateCallback {
    /**
     * 空调状态发生变化
     * @param state 最新的完整状态
     */
    fun onStateChanged(state: ACState)
}
