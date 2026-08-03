package com.yuwjoo.myhome.module.udp.client

import kotlinx.coroutines.Dispatchers

/**
 * UDP 客户端统一调度器：单线程串行化所有共享状态操作
 * 通过 limitedParallelism(1) 保证同一时刻只有一个协程在此调度器上执行，
 * delay() 挂起时自动调度下一个就绪协程，无需任何锁机制。
 */
internal val UdpDispatcher = Dispatchers.IO.limitedParallelism(1)
