<!--
  @file 项目表单弹窗组件
  @description 新增 / 修改本地项目：录入项目类型、名称、路径、发布控制器与当前版本号
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Folder } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { IProjectInfo, TPublishController } from '@shared/types/config/publishConfig'
import { openFilePicker } from '@renderer/utils/filePicker'
import { publishControllerLabels, resolveProjectKey } from '../utils/project'
import { isValidVersion } from '../utils/version'

defineOptions({ name: 'projectFormDialog' })

/**
 * 组件属性
 */
const props = defineProps<{
  /** 是否展示弹窗 */
  modelValue: boolean
  /** 待修改的项目；为空表示新增项目 */
  project?: IProjectInfo | null
  /** 已有项目列表，用于校验项目是否重复 */
  projects: IProjectInfo[]
  /** 父组件是否正在保存（保存中时确认按钮进入 loading） */
  submitting?: boolean
}>()

/**
 * 组件事件
 */
const emit = defineEmits<{
  /** 更新弹窗展示状态 */
  (event: 'update:modelValue', value: boolean): void
  /** 提交表单数据 */
  (event: 'submit', project: IProjectInfo): void
}>()

/**
 * 生成一份新项目的初始数据
 * @returns 版本号为 0.0.0、控制器为通用 Web 的项目信息
 */
function createEmptyProject(): IProjectInfo {
  return {
    projectName: '',
    projectPath: '',
    latestVersion: '0.0.0',
    projectType: '',
    publishController: 'generalWeb'
  }
}

// 表单实例
const formRef = ref<FormInstance>()
// 表单数据
const formData = reactive<IProjectInfo>(createEmptyProject())
// 弹窗展示状态：受父组件 v-model 控制
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
// 是否为修改模式
const isEdit = computed(() => !!props.project)
// 发布控制器下拉选项
const controllerOptions = computed(() =>
  (Object.keys(publishControllerLabels) as TPublishController[]).map((value) => ({
    label: publishControllerLabels[value],
    value
  }))
)

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
 * 表单校验规则
 */
const rules: FormRules = {
  projectType: [{ required: true, message: '请填写项目类型', trigger: 'blur' }],
  projectName: [{ required: true, message: '请填写项目名称', trigger: 'blur' }],
  projectPath: [{ required: true, message: '请选择或填写项目路径', trigger: 'blur' }],
  publishController: [{ required: true, message: '请选择发布控制器', trigger: 'change' }],
  latestVersion: [{ validator: validateVersion, trigger: 'blur' }]
}

/**
 * 打开弹窗时按模式填充表单：修改时复制原项目，新增时用初始数据
 */
watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) return
    formRef.value?.clearValidate()
    Object.assign(formData, props.project ? { ...props.project } : createEmptyProject())
  }
)

/**
 * 校验是否存在同类型同名项目
 * @returns 重复时为 true
 */
function isDuplicated(): boolean {
  const currentKey = props.project ? resolveProjectKey(props.project) : ''
  return props.projects.some(
    (item) =>
      resolveProjectKey(item) !== currentKey &&
      item.projectType === formData.projectType &&
      item.projectName === formData.projectName
  )
}

/**
 * 选择项目目录
 * @returns 选择完成的 Promise
 */
async function handlePickDirectory(): Promise<void> {
  const directoryPath = await openFilePicker(true)
  if (directoryPath) formData.projectPath = directoryPath
}

/**
 * 提交表单：校验通过后把数据交给父组件保存
 * @returns 提交完成的 Promise
 */
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (isDuplicated()) {
    ElMessage.warning('已存在相同类型的同名项目，请调整项目类型或项目名称')
    return
  }
  emit('submit', { ...formData })
}
</script>

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
        <el-input
          v-model="formData.projectType"
          placeholder="如 android / web，与项目名称共同定位项目"
          :disabled="isEdit"
          clearable
        />
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
        <el-input v-model="formData.projectPath" placeholder="请选择项目根目录" clearable>
          <template #append>
            <el-button :icon="Folder" @click="handlePickDirectory">选择</el-button>
          </template>
        </el-input>
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
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

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
