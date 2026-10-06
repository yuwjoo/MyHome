/**
 * @file 项目 hook 类型
 * @description 定义项目提交这一整套操作的入参与形态
 */
import type { Ref } from 'vue'
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import type { TEmitOnly } from '@renderer/types/emits'
import type { TProjectFormDialogEmits } from '../../types/defines'

/**
 * 只保留 change 的事件派发：由组件的 emits 推导而来
 *
 * 组件完整的 emit 可以直接赋值进来，但 hook 内部只能抛 change：
 * 抛别的事件名或参数对不上都会编译报错
 */
export type TEmitProjectChange = TEmitOnly<TProjectFormDialogEmits, 'change'>

/**
 * 项目 hook 入参
 */
export type TUseProjectOptions = {
  /**
   * 已有项目列表，用于查重
   */
  projects: Ref<IProjectInfo[]>
  /**
   * 表单数据
   */
  formData: Ref<IProjectInfo>
  /**
   * 是否为修改模式
   */
  isEdit: Ref<boolean>
  /**
   * 表单校验
   * @returns 校验通过为 true
   */
  validate: () => Promise<boolean>
  /**
   * 关闭弹窗
   */
  close: () => void
  /**
   * 组件的事件派发函数，只允许抛出 change
   */
  emit: TEmitProjectChange
}

/**
 * 项目能力
 */
export type TUseProject = {
  /**
   * 是否正在提交
   */
  submitLoading: Ref<boolean>
  /**
   * 提交项目：校验、查重、写入本地配置，成功后关闭弹窗并通知外部
   * @returns 操作完成的 Promise
   */
  submit: () => Promise<void>
}
