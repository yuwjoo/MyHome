/**
 * @file 项目表单 hook
 * @description 持有项目表单的数据，提供初始数据、校验规则与校验能力
 */
import { ref } from 'vue'
import type { ShallowRef } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import { isValidVersion } from '../../../utils/version'
import { createEmptyProject } from '../../../utils/project'
import type { TUseForm } from '../types/hooks/form'

/**
 * 校验当前版本号：必填且须为点分数字
 * @param _rule 表单规则，未使用
 * @param value 待校验的版本号
 * @param callback Element Plus 的校验回调
 */
function validateVersion(_rule: unknown, value: string, callback: (error?: Error) => void): void {
  if (!value) {
    callback(new Error('请填写当前版本号'))
    return
  }
  if (!isValidVersion(value)) {
    callback(new Error('版本号须为点分数字，如 1.2.3'))
    return
  }
  callback()
}

/**
 * 项目表单：数据、校验规则与校验入口都收在这里
 * @param formRef 表单实例，由调用方按模板 ref 取到后传入
 * @returns 表单能力
 */
export function useForm(formRef: Readonly<ShallowRef<FormInstance | null>>): TUseForm {
  // 表单数据
  const formData = ref<IProjectInfo>(createEmptyProject())
  // 表单校验规则
  const rules: FormRules = {
    projectType: [{ required: true, message: '请填写项目类型', trigger: 'blur' }],
    projectName: [{ required: true, message: '请填写项目名称', trigger: 'blur' }],
    projectPath: [{ required: true, message: '请选择或填写项目路径', trigger: 'blur' }],
    publishController: [{ required: true, message: '请选择发布控制器', trigger: 'change' }],
    latestVersion: [{ validator: validateVersion, trigger: 'blur' }]
  }

  /**
   * 清除表单的校验痕迹
   */
  const clearValidate = (): void => {
    formRef.value?.clearValidate()
  }

  /**
   * 校验表单
   * @returns 校验通过为 true
   */
  const validate = async (): Promise<boolean> => {
    if (!formRef.value) return false
    try {
      return await formRef.value.validate()
    } catch {
      return false
    }
  }

  return { formData, rules, clearValidate, validate }
}
