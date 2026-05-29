package com.yuwjoo.myhome

import android.app.Application

class MyApplication : Application() {

    companion object {
        private lateinit var instance: Application
        val application
            get() = instance
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }
}