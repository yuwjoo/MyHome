/**
 * @file 路径输入组件 prop / emit 类型
 * @description 由 options 式 props 定义推导对内与对外两种类型，并声明对外抛出的事件
 */
import type { ExtractPropTypes, ExtractPublicPropTypes } from 'vue'
import type { pathInputProps } from '../common/props'

/**
 * 路径输入组件对内 props
 *
 * 组件内部读到的形态：带默认值的属性一定有值，不需要再判空
 */
export type IPathInputProps = ExtractPropTypes<typeof pathInputProps>

/**
 * 路径输入组件对外 props
 *
 * 父组件使用时的形态：带默认值的属性可以省略
 */
export type IPublicPathInputProps = ExtractPublicPropTypes<typeof pathInputProps>

/**
 * 路径输入组件 emits
 */
export type TPathInputEmits = {
  /** 路径变化：手动输入或选择文件后抛出，携带输入框路径与完整路径 */
  (e: 'change', path: string, fullPath: string): void
}
