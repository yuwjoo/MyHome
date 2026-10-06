/**
 * @file 弹窗显隐 hook
 * @description 管理弹窗展示状态与新增 / 修改模式，打开弹窗时直接把表单数据置成对应模式的内容
 */
import { nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import type { TUseDialog } from '../types/hooks/dialog'
import { createEmptyProject } from '../../../utils/project'

/**
 * 弹窗显隐：展示状态、模式与表单数据都由组件自己持有，外部只调打开 / 关闭
 * @param formData 表单数据，打开弹窗时按模式整体替换
 * @param clearValidate 清除校验痕迹，打开弹窗时清掉上一次留下的提示
 * @returns 弹窗显隐能力
 */
export function useDialog(formData: Ref<IProjectInfo>, clearValidate: () => void): TUseDialog {
  // 弹窗展示状态
  const visible = ref(false)
  // 是否为修改模式
  const isEdit = ref(false)

  /**
   * 打开弹窗：填好数据、定好模式，并在表单渲染完成后清掉上一次的校验痕迹
   * @param project 表单数据
   * @param edit 是否为修改模式
   */
  function open(project: IProjectInfo, edit: boolean): void {
    formData.value = project
    isEdit.value = edit
    visible.value = true
    // 首次打开时表单还没渲染，等到 DOM 更新后再清，保证一定能拿到表单实例
    void nextTick(clearValidate)
  }

  /**
   * 以新增模式打开弹窗：表单数据重置为空项目
   */
  const openCreate = (): void => {
    open(createEmptyProject(), false)
  }

  /**
   * 以修改模式打开弹窗：表单数据置为传入的项目
   * @param project 待修改的项目
   */
  const openEdit = (project: IProjectInfo): void => {
    // 复制一份，避免表单编辑直接改到外部列表里的项目对象
    open({ ...project }, true)
  }

  /**
   * 关闭弹窗
   */
  const close = (): void => {
    visible.value = false
  }

  return { visible, isEdit, openCreate, openEdit, close }
}
