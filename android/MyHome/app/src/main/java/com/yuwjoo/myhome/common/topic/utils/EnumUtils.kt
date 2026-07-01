package com.yuwjoo.myhome.common.topic.utils

/**
 * 根据字符串值查找对应枚举项，未匹配时返回 [default]。
 *
 * @param value   待匹配的字符串
 * @param default 未匹配时的默认枚举值
 * @param prop    提取枚举值中与 [value] 比较的属性
 */
inline fun <reified E : Enum<E>> enumByValue(value: String, default: E, crossinline prop: (E) -> String): E {
    return enumValues<E>().firstOrNull { prop(it) == value } ?: default
}
