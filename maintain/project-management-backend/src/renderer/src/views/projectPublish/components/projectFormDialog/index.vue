<!--
  @file 项目表单弹窗组件
  @description 新增 / 修改本地项目：表单录入、校验与保存请求都在组件内完成，
    外部只需调用 openCreate / openEdit 打开弹窗，并监听 change 处理后续事情
-->
<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '修改项目' : '新增项目'"
    width="560px"
    :close-on-click-modal="false"
  >
    <el-alert
      v-if="isEdit"
      class="project-form__tip"
      type="info"
      show-icon
      :closable="false"
      title="项目类型与项目名称是项目的唯一标识，不支持修改；如需调整请先删除该项目再新增"
    />

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="96px" @submit.prevent>
      <el-form-item label="项目类型" prop="projectType">
        <el-select
          v-model="formData.projectType"
          class="project-form__select"
          placeholder="如 android / web，与项目名称共同定位项目"
          :disabled="isEdit"
          filterable
          allow-create
          default-first-option
          clearable
        >
          <el-option v-for="type in projectTypeOptions" :key="type" :label="type" :value="type" />
        </el-select>
      </el-form-item>

      <el-form-item label="项目名称" prop="projectName">
        <el-input
          v-model="formData.projectName"
          placeholder="如 MyHomeApp"
          :disabled="isEdit"
          clearable
        />
      </el-form-item>

      <el-form-item label="项目路径" prop="projectPath">
        <path-input
          v-model:path="formData.projectPath"
          placeholder="请选择项目根目录"
          allow-file-picker
          clearable
        />
      </el-form-item>

      <el-form-item label="发布控制器" prop="publishController">
        <el-select v-model="formData.publishController" class="project-form__select">
          <el-option
            v-for="option in controllerOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="当前版本" prop="latestVersion">
        <el-input v-model="formData.latestVersion" placeholder="如 1.0.0" clearable />
        <p class="project-form__hint">
          已发布的最新版本号；发布成功后会自动更新，仅在本地记录与实际不一致时手动修正
        </p>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { toRefs, useTemplateRef } from 'vue'
import type { FormInstance } from 'element-plus'
import { projectFormDialogProps } from './defines/props'
import type { TProjectFormDialogEmits } from './types/defines'
import { useDialog } from './hooks/dialog'
import { useForm } from './hooks/form'
import { useOptions } from './hooks/options'
import { useProject } from './hooks/project'

defineOptions({
  name: 'projectFormDialog'
})

const props = defineProps(projectFormDialogProps)
const emit = defineEmits<TProjectFormDialogEmits>()

const { projects } = toRefs(props)

// 表单实例
const formRef = useTemplateRef<FormInstance>('formRef')

// 表单hook
const { formData, rules, clearValidate, validate } = useForm(formRef)
// 弹窗hook
const { visible, isEdit, openCreate, openEdit, close } = useDialog(formData, clearValidate)
// 选项数据hook
const { controllerOptions, projectTypeOptions } = useOptions(projects)
// 项目hook
const { submitLoading, submit } = useProject({
  projects,
  formData,
  isEdit,
  validate,
  close,
  emit
})

defineExpose({
  openCreate,
  openEdit,
  close
})
</script>

<style scoped lang="scss">
.project-form {
  &__tip {
    margin-bottom: 16px;
  }

  &__select {
    width: 100%;
  }

  &__hint {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
