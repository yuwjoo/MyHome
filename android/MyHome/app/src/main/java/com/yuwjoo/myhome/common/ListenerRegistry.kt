package com.yuwjoo.myhome.common

import android.util.Log
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet

/**
 * 泛型监听器注册表，提供线程安全的分组注册、取消注册与事件分发能力。
 *
 * @param K 分组键类型（如 topic 名称、Unit 等）
 * @param L 监听器类型
 */
class ListenerRegistry<K, L> {

    companion object {
        private const val TAG = "ListenerRegistry"
    }

    private val listeners = ConcurrentHashMap<K, CopyOnWriteArraySet<L>>()

    /**
     * 向指定 key 注册监听器。
     *
     * @param key      分组键
     * @param listener 监听器
     */
    fun register(key: K, listener: L) {
        listeners.getOrPut(key) { CopyOnWriteArraySet() }.add(listener)
    }

    /**
     * 从指定 key 取消注册监听器，若该 key 下已无监听器则清理空集合。
     *
     * @param key      分组键
     * @param listener 已注册的监听器
     */
    fun unregister(key: K, listener: L) {
        listeners[key]?.remove(listener)
        if (listeners[key].isNullOrEmpty()) {
            listeners.remove(key)
        }
    }

    /**
     * 清空指定 key 下的所有监听器。
     *
     * @param key 分组键
     */
    fun clearKey(key: K) {
        listeners.remove(key)
    }

    /**
     * 清空所有监听器。
     */
    fun clearAll() {
        listeners.clear()
    }

    /**
     * 向指定 key 的所有监听器分发事件。单个监听器异常不影响其他监听器。
     *
     * @param key    分组键
     * @param action 对每个监听器执行的操作
     */
    fun dispatch(key: K, action: (L) -> Unit) {
        listeners[key]?.forEach { listener ->
            try {
                action(listener)
            } catch (e: Exception) {
                Log.e(TAG, "dispatch error for key=$key: ${e.message}", e)
            }
        }
    }

    /**
     * 向所有 key 下的所有监听器分发事件。单个监听器异常不影响其他监听器。
     *
     * @param action 对每个监听器执行的操作
     */
    fun dispatchAll(action: (L) -> Unit) {
        listeners.values.flatten().forEach { listener ->
            try {
                action(listener)
            } catch (e: Exception) {
                Log.e(TAG, "dispatchAll error: ${e.message}", e)
            }
        }
    }
}
