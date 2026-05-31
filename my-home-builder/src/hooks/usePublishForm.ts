/**
 * 发布表单 Hook
 * 管理发布表单的状态、校验和提交逻辑
 */

import { reactive, ref, type Ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { PublishForm } from '@/types/publish';

/** 发布表单 Hook 返回值 */
interface UsePublishFormReturn {
  /** 表单数据 */
  form: PublishForm;
  /** 表单引用 */
  formRef: Ref<FormInstance | null>;
  /** 校验规则 */
  rules: FormRules;
  /** 校验并获取表单数据 */
  validate: () => Promise<PublishForm>;
  /** 重置表单 */
  resetForm: () => void;
}

/**
 * 发布表单 Hook
 * 封装表单状态管理和校验逻辑
 */
export const usePublishForm = (): UsePublishFormReturn => {
  const formRef = ref<FormInstance | null>(null);

  /** 表单初始值 */
  const initForm = (): PublishForm => ({
    projectId: '',
    env: 'dev',
    version: '',
    description: '',
    autoPublish: false,
  });

  const form = reactive<PublishForm>(initForm());

  /** 表单校验规则 */
  const rules: FormRules = {
    projectId: [
      { required: true, message: '请选择项目', trigger: 'change' },
    ],
    env: [
      { required: true, message: '请选择构建环境', trigger: 'change' },
    ],
    version: [
      { required: true, message: '请输入版本号', trigger: 'blur' },
      {
        pattern: /^\d+\.\d+\.\d+$/,
        message: '版本号格式如: 1.0.0',
        trigger: 'blur',
      },
    ],
  };

  /**
   * 校验表单
   * @returns 校验通过的表单数据
   */
  const validate = async (): Promise<PublishForm> => {
    if (!formRef.value) {
      throw new Error('表单实例未初始化');
    }
    await formRef.value.validate();
    return { ...form };
  };

  /** 重置表单 */
  const resetForm = () => {
    Object.assign(form, initForm());
    formRef.value?.resetFields();
  };

  return {
    form,
    formRef,
    rules,
    validate,
    resetForm,
  };
};
