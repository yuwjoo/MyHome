package com.yuwjoo.myhomecontroller.mqtt

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import com.ven.assists.AssistsCore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.eclipse.paho.mqttv5.client.IMqttToken
import org.eclipse.paho.mqttv5.client.MqttDisconnectResponse
import org.json.JSONObject

/**
 * MyHomeController MQTT管理类（单例模式）
 * 封装ForegroundService中使用的MQTT相关功能
 * 提供连接、订阅、断开等MQTT操作的统一接口
 * 采用双重检查锁定模式确保线程安全的单例实现
 */
class MyHomeControllerMQTT private constructor() {

    companion object {
        private const val TAG = "MyHomeControllerMQTT"

        // MQTT服务器配置
        private const val MQTT_SERVER_URI = "tcp://47.115.161.79:1883"
        private const val MQTT_USERNAME = "my_home_controller"
        private const val MQTT_PASSWORD = "my_home_controller"
        private const val MQTT_DEFAULT_QOS = 1
        private const val MQTT_TOPIC = "home/ir"

        // 单例实例
        @Volatile
        private var instance: MyHomeControllerMQTT? = null

        /**
         * 获取单例实例
         * 使用双重检查锁定模式确保线程安全
         */
        fun getInstance(): MyHomeControllerMQTT {
            if (instance == null) {
                synchronized(MyHomeControllerMQTT::class.java) {
                    if (instance == null) {
                        instance = MyHomeControllerMQTT()
                    }
                }
            }
            return instance!!
        }
    }

    private lateinit var mqttManager: MQTTManager
    private var isInitialized = false

    // WakeLock相关
    private var wakeLock: PowerManager.WakeLock? = null

    // 定时任务相关
    private val handler = Handler(Looper.getMainLooper())
    private var isOff = false
    private var openMinute: Long = 60
    private var closeMinute: Long = 120

    // 定时任务Runnable
    private val task = object : Runnable {
        private val scope = CoroutineScope(Dispatchers.Default)
        override fun run() {
            Log.d(TAG, "执行定时任务")
            scope.launch {
                performPowerButtonClick()
            }
            if (isOff) {
                handler.postDelayed(this, openMinute * 60 * 1000)
            } else {
                handler.postDelayed(this, closeMinute * 60 * 1000)
            }
            isOff = !isOff
        }
    }

    /**
     * 初始化MQTT客户端
     * @param context 上下文对象，用于获取系统服务
     */
    fun init(context: Context) {
        if (!isInitialized) {
            // 初始化WakeLock
            context.let { ctx ->
                val powerManager = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
                wakeLock = powerManager.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK or
                            PowerManager.ACQUIRE_CAUSES_WAKEUP or
                            PowerManager.ON_AFTER_RELEASE,
                    "MyHomeController:MqttWakeLock"
                )
            }

            mqttManager = MQTTManager()

            // 初始化MQTT连接参数
            mqttManager.init(
                serverUri = MQTT_SERVER_URI,
                username = MQTT_USERNAME,
                password = MQTT_PASSWORD,
                defaultQos = MQTT_DEFAULT_QOS
            )

            // 设置连接状态回调
            mqttManager.setConnectionCallback(object : MQTTManager.MQTTConnectionCallback {
                override fun onConnectComplete(reconnect: Boolean, serverURI: String) {
                    Log.d(TAG, "MQTT连接完成 - 是否重连: $reconnect, 服务器URI: $serverURI")
                    // 连接成功后订阅主题
                    subscribeToTopic()
                }

                override fun onDisconnected(disconnectResponse: MqttDisconnectResponse) {
                    Log.d(TAG, "MQTT已断开连接: $disconnectResponse")
                    // 断开连接时取消定时任务
                    cancelScheduledTask()
                }

                override fun onDeliveryComplete(token: IMqttToken) {
                    Log.d(TAG, "MQTT消息发送完成")
                }

                override fun onError(exception: Exception) {
                    Log.e(TAG, "MQTT错误: ${exception.message}")
                }
            })

            // 设置消息接收回调
            mqttManager.setMessageCallback(object : MQTTManager.MQTTMessageCallback {
                override fun onMessageReceived(topic: String, message: String, qos: Int) {
                    Log.d(TAG, "收到MQTT消息 - 主题: $topic, 消息: $message, QoS: $qos")
                    // 处理接收到的MQTT消息
                    handleMqttMessage(message)
                }
            })

            isInitialized = true
        }
    }

    /**
     * 处理接收到的MQTT消息
     */
    private fun handleMqttMessage(message: String) {
        try {
            val json = JSONObject(message)
            val type = json.optString("type")

            if (type.equals("按键")) {
                handleKeyPressMessage()
            } else if (type.equals("定时")) {
                handleTimerMessage(json)
            }
        } catch (e: Exception) {
            Log.e(TAG, "处理MQTT消息失败: ${e.message}")
        }
    }

    /**
     * 处理按键类型消息
     */
    private fun handleKeyPressMessage() {
        val scope = CoroutineScope(Dispatchers.Default)

        // 获取WakeLock
        wakeLock?.acquire(10 * 60 * 1000L /*10分钟*/)
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }

        // 执行按键操作
        scope.launch {
            performPowerButtonClick()
        }
    }

    /**
     * 处理定时类型消息
     */
    private fun handleTimerMessage(json: JSONObject) {
        isOff = json.optBoolean("isOff")
        openMinute = json.optLong("openMinute", 60)
        closeMinute = json.optLong("closeMinute", 120)

        // 取消已有的定时任务并启动新的
        cancelScheduledTask()
        startScheduledTask()
    }

    /**
     * 执行电源按键点击操作
     */
    private suspend fun performPowerButtonClick() {
        try {
            AssistsCore.gestureClick(250F, 1150F, 500) // 开关机键
            Log.d(TAG, "执行了开关机键点击操作")
        } catch (e: Exception) {
            Log.e(TAG, "执行手势点击失败: ${e.message}")
        }
    }

    /**
     * 启动定时任务
     */
    private fun startScheduledTask() {
        handler.post(task)
        Log.d(TAG, "定时任务已启动")
    }

    /**
     * 取消定时任务
     */
    private fun cancelScheduledTask() {
        handler.removeCallbacks(task)
        Log.d(TAG, "定时任务已取消")
    }

    /**
     * 连接到MQTT服务器
     * @return 是否成功开始连接过程
     */
    fun connect(): Boolean {
        return if (isInitialized) {
            mqttManager.connect()
        } else {
            Log.e(TAG, "MQTT管理器未初始化，请先调用init方法")
            false
        }
    }

    /**
     * 断开与MQTT服务器的连接
     */
    fun disconnect() {
        if (isInitialized) {
            // 取消定时任务
            cancelScheduledTask()
            // 释放WakeLock
            releaseWakeLock()
            // 断开MQTT连接
            mqttManager.disconnect()
        }
    }

    /**
     * 释放WakeLock
     */
    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null
    }

    /**
     * 订阅主题
     * @return 是否订阅成功
     */
    private fun subscribeToTopic(): Boolean {
        return if (isInitialized) {
            mqttManager.subscribe(MQTT_TOPIC)
        } else {
            false
        }
    }

    /**
     * 检查MQTT连接状态
     * @return 是否已连接到MQTT服务器
     */
    fun isConnected(): Boolean {
        return if (isInitialized) {
            mqttManager.isConnected()
        } else {
            false
        }
    }
}