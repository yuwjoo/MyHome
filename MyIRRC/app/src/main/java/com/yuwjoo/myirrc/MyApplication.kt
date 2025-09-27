package com.yuwjoo.myirrc

import android.app.Application
import android.hardware.ConsumerIrManager
import android.widget.Toast
import com.yuwjoo.myirrc.service.ForegroundService

class MyApplication : Application() {

    companion object {
        private lateinit var instance: Application
        val application
            get() = instance
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        // 检查红外功能
        val cim = getSystemService(CONSUMER_IR_SERVICE) as ConsumerIrManager
        if (!cim.hasIrEmitter()) {
            Toast.makeText(this, "当前手机不支持红外遥控", Toast.LENGTH_LONG).show()
        }

        // 启动前台服务
        ForegroundService.startService(this)
    }
}