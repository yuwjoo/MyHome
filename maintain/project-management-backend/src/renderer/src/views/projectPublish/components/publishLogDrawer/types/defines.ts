/**
 * @file 发布日志抽屉组件 prop / emit 类型
 * @description 由 options 式 props 定义推导对内与对外两种类型，并声明对外抛出的事件
 */
import type { ExtractPropTypes, ExtractPublicPropTypes } from 'vue'
import type { publishLogDrawerProps } from '../defines/props'

/**
 * 发布日志抽屉组件对内 props
 *
 * 组件内部读到的形态：带默认值的属性一定有值，不需要再判空
 */
export type TPublishLogDrawerProps = ExtractPropTypes<typeof publishLogDrawerProps>

/**
 * 发布日志抽屉组件对外 props
 *
 * 父组件使用时的形态：带默认值的属性可以省略
 */
export type TPublicPublishLogDrawerProps = ExtractPublicPropTypes<typeof publishLogDrawerProps>

/**
 * 发布日志抽屉组件 emits
 */
export type TPublishLogDrawerEmits = {
  /** 更新抽屉展示状态 */
  'update:modelValue': [value: boolean]
  /** 清空当前展示的日志 */
  clear: []
}
