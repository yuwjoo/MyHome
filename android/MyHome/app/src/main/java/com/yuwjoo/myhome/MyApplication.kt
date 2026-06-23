/**
 * Application 入口，负责全局初始化
 */
package com.yuwjoo.myhome

import android.app.Application
import com.yuwjoo.myhome.module.mqtt.MqttManager

class MyApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        MqttManager.connect()
    }
}
