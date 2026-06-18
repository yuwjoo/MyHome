/**
 * Application 入口，负责全局初始化
 */
package com.yuwjoo.myhome

import android.app.Application
import com.yuwjoo.myhome.modules.mqtt.MqttManager

class MyHomeApp : Application() {

    override fun onCreate() {
        super.onCreate()
        MqttManager.init(this)
        MqttManager.getInstance().connect()
    }
}
