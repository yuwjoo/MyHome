package com.yuwjoo.myhome.common.floatWindow

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.View.OnTouchListener
import android.view.WindowManager
import android.widget.TextView
import android.widget.Toast
import com.yuwjoo.myhome.R
import kotlin.math.hypot

class FloatWindowService : Service() {
    // 悬浮窗管理器
    private var mWindowManager: WindowManager? = null

    // 悬浮窗根视图
    private var mFloatView: View? = null

    // 悬浮窗布局参数
    private var mLayoutParams: WindowManager.LayoutParams? = null

    // 记录拖拽时的初始坐标
    private var mLastX = 0
    private var mLastY = 0
    private var mStartX = 0
    private var mStartY = 0

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        initFloatWindow() // 创建悬浮窗
    }

    /**
     * 初始化悬浮窗
     */
    private fun initFloatWindow() {
        // 1. 获取 WindowManager 实例
        mWindowManager = getSystemService(WINDOW_SERVICE) as WindowManager?

        // 2. 加载悬浮窗布局（可自定义布局，这里用简单的 TextView）
        mFloatView = LayoutInflater.from(this).inflate(R.layout.float_window_layout, null)
        val tvFloat = mFloatView!!.findViewById<TextView?>(R.id.tv_float)
        tvFloat.setText("悬浮窗示例")

        // 3. 配置 WindowManager 参数（核心）
        mLayoutParams = WindowManager.LayoutParams()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Android 8.0+ 必须使用 TYPE_APPLICATION_OVERLAY
            mLayoutParams!!.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            // 8.0 以下使用 TYPE_PHONE
            mLayoutParams!!.type = WindowManager.LayoutParams.TYPE_PHONE
        }
        // 设置悬浮窗可触摸、可聚焦（支持点击/拖拽）
        mLayoutParams!!.flags = (WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL)
        // 设置背景透明
        mLayoutParams!!.format = PixelFormat.TRANSLUCENT
        // 设置悬浮窗大小（wrap_content）
        mLayoutParams!!.width = WindowManager.LayoutParams.WRAP_CONTENT
        mLayoutParams!!.height = WindowManager.LayoutParams.WRAP_CONTENT
        // 设置初始位置（屏幕右上角）
        mLayoutParams!!.gravity = Gravity.TOP or Gravity.START
        mLayoutParams!!.x = 300 // X 轴偏移量（像素）
        mLayoutParams!!.y = 500 // Y 轴偏移量（像素）

        // 4. 设置悬浮窗触摸事件（拖拽）
        mFloatView!!.setOnTouchListener(object : OnTouchListener {
            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                // 计算移动偏移量
                val dx = event.getRawX().toInt() - mLastX
                val dy = event.getRawY().toInt() - mLastY

                when (event.getAction()) {
                    MotionEvent.ACTION_DOWN -> {
                        // 记录按下时的坐标
                        mLastX = event.getRawX().toInt()
                        mLastY = event.getRawY().toInt()
                        mStartX = mLayoutParams!!.x
                        mStartY = mLayoutParams!!.y
                    }

                    MotionEvent.ACTION_MOVE -> {
                        // 更新悬浮窗位置
                        mLayoutParams!!.x = mStartX + dx
                        mLayoutParams!!.y = mStartY + dy
                        // 刷新悬浮窗位置
                        mWindowManager!!.updateViewLayout(mFloatView, mLayoutParams)
                    }

                    MotionEvent.ACTION_UP -> {
                        // 抬起时可处理点击（如果移动距离小则视为点击）
                        val moveDistance = hypot(dx.toDouble(), dy.toDouble()).toInt()
                        if (moveDistance < 10) {
                            // 点击事件逻辑
                            Toast.makeText(
                                this@FloatWindowService,
                                "悬浮窗被点击",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                }
                // 返回 true 表示消费触摸事件，避免穿透到下层
                return true
            }
        })

        // 5. 将悬浮窗添加到屏幕
        mWindowManager!!.addView(mFloatView, mLayoutParams)
    }

    override fun onDestroy() {
        super.onDestroy()
        // 销毁时移除悬浮窗（避免内存泄漏）
        if (mFloatView != null && mWindowManager != null) {
            mWindowManager!!.removeView(mFloatView)
        }
    }
}