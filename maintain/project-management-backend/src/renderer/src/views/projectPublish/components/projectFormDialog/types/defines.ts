/**
 * @file 项目表单弹窗组件 prop / emit 类型
 * @description 由 options 式 props 定义推导对内与对外两种类型，并声明对外抛出的事件与暴露的方法
 */
import type { ExtractPropTypes, ExtractPublicPropTypes } from 'vue'
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import type { projectFormDialogProps } from '../defines/props'

/**
 * 项目表单弹窗组件对内 props
 *
 * 组件内部读到的形态：带默认值的属性一定有值，不需要再判空
 */
export type TProjectFormDialogProps = ExtractPropTypes<typeof projectFormDialogProps>

/**
 * 项目表单弹窗组件对外 props
 *
 * 父组件使用时的形态：带默认值的属性可以省略
 */
export type TPublicProjectFormDialogProps = ExtractPublicPropTypes<typeof projectFormDialogProps>

/**
 * 项目表单弹窗组件 emits
 */
export type TProjectFormDialogEmits = {
  /** 项目已保存：新增或修改的接口请求成功后抛出，携带保存的项目信息，供外部刷新列表等后续处理 */
  change: [project: IProjectInfo]
}

/**
 * 项目表单弹窗组件对外暴露的方法
 *
 * 新增 / 修改都在组件内完成，外部只需按场景调用对应的打开方法
 */
export interface IProjectFormDialogExpose {
  /**
   * 以新增模式打开弹窗
   */
  openCreate: () => void
  /**
   * 以修改模式打开弹窗
   * @param project 待修改的项目
   */
  openEdit: (project: IProjectInfo) => void
  /**
   * 关闭弹窗
   */
  close: () => void
}
