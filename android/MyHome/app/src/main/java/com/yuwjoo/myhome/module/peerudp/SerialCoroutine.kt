package com.yuwjoo.myhome.module.peerudp

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.SupervisorJob

/**
 * 单线程串行协程：提供串行调度器与协程作用域
 */
@OptIn(ExperimentalCoroutinesApi::class)
object SerialCoroutine {

    val dispatcher = Dispatchers.IO.limitedParallelism(1) // 单线程串行调度器
    val scope = CoroutineScope(SupervisorJob() + dispatcher) // 协程作用域
}
