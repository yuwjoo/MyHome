/**
 * @file 项目 hook
 * @description 提供项目提交这一整套操作：校验表单、查重、写入本地配置、收尾通知
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { electronApi } from '@renderer/utils/electronApi'
import { resolveErrorMessage } from '@renderer/utils/error'
import { resolveProjectKey } from '../../../utils/project'
import type { TUseProject, TUseProjectOptions } from '../types/hooks/project'

/**
 * 项目操作：提交流程与提交状态都收在这里
 * @param options 操作所需的数据与外部能力
 * @returns 项目能力
 */
export function useProject(options: TUseProjectOptions): TUseProject {
  const { projects, formData, isEdit, validate, close, emit } = options

  // 是否正在提交
  const submitLoading = ref(false)

  /**
   * 校验是否存在同类型同名项目
   * @returns 重复时为 true
   */
  function isDuplicated(): boolean {
    // 修改模式下项目类型与名称不允许改动，用表单里的值即可定位到自身，避免把自己判成重复
    const currentKey = isEdit.value ? resolveProjectKey(formData.value) : ''
    return projects.value.some(
      (item) =>
        resolveProjectKey(item) !== currentKey &&
        item.projectType === formData.value.projectType &&
        item.projectName === formData.value.projectName
    )
  }

  /**
   * 提交项目
   * @returns 提交完成的 Promise
   */
  const submit = async (): Promise<void> => {
    if (!(await validate())) return
    if (isDuplicated()) {
      ElMessage.warning('已存在相同类型的同名项目，请调整项目类型或项目名称')
      return
    }
    const project = { ...formData.value }
    submitLoading.value = true
    try {
      await electronApi.publish.saveLocalProject(project)
      ElMessage.success(`项目已保存：${resolveProjectKey(project)}`)
      close()
      emit('change', project)
    } catch (error) {
      ElMessage.error(resolveErrorMessage(error, '保存项目失败'))
    } finally {
      submitLoading.value = false
    }
  }

  return { submitLoading, submit }
}
