package com.yuwjoo.myhome.module.bridge.annotation

/**
 * 分组注解
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class BridgeGroup(val value: String)
