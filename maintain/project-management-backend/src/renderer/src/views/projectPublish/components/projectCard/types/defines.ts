/**
 * @file 项目卡片组件 prop / emit 类型
 * @description 由 options 式 props 定义推导对内与对外两种类型，并声明对外抛出的事件
 */
import type { ExtractPropTypes, ExtractPublicPropTypes } from 'vue'
import type { projectCardProps } from '../defines/props'

/**
 * 项目卡片组件对内 props
 *
 * 组件内部读到的形态：带默认值的属性一定有值，不需要再判空
 */
export type TProjectCardProps = ExtractPropTypes<typeof projectCardProps>

/**
 * 项目卡片组件对外 props
 *
 * 父组件使用时的形态：带默认值的属性可以省略
 */
export type TPublicProjectCardProps = ExtractPublicPropTypes<typeof projectCardProps>

/**
 * 项目卡片组件 emits
 */
export type TProjectCardEmits = {
  /** 修改目标版本号 */
  'update:targetVersion': [value: string]
  /** 按当前目标版本号发布 */
  publish: [targetVersion: string]
  /** 中止当前发布 */
  abort: []
  /** 编辑项目 */
  edit: []
  /** 删除项目 */
  remove: []
  /** 查看该项目日志 */
  viewLog: []
}
