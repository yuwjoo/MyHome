package com.yuwjoo.myhome.module.bridge.annotation

/**
 * 消息方法注解
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class BridgeMessage(val value: String)
