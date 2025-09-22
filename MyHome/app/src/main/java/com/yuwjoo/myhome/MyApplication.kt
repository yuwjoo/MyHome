package com.yuwjoo.myhome

import android.app.Application

class MyApplication : Application() {

    companion object {
        private lateinit var application: Application
        val appContext
            get() = application
    }

    override fun onCreate() {
        super.onCreate()
        application = this
    }
}