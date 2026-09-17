<!--
  @file 配置管理页
  @description 配置并保存发布所需的本地资源目录、OSS 资源路径与 Android Studio 路径
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Folder } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { ISetting } from '@shared/types/ipc/publish'
import { resolveErrorMessage } from '@renderer/utils/error'
import { electronApi } from '@renderer/utils/electronApi'
import { pickDirectoryPath } from '@renderer/utils/pathPicker'

defineOptions({ name: 'configManagement' })

/**
 * 生成一份空设置数据
 * @returns 各配置路径均为空的设置数据
 */
function createEmptySetting(): ISetting {
  return {
    localAssets: { rootDir: '', secretDir: '' },
    ossAssets: { rootDir: '', versionManifestPath: '', secretPath: '' },
    androidStudio: { jdkPath: '', sdkPath: '' }
  }
}

/**
 * 按本地文件系统风格拼接根目录与相对路径
 * @param rootDir 根目录绝对路径
 * @param relativePath 相对根目录的路径；填绝对路径时按绝对路径处理
 * @returns 拼接后的完整路径，任一项为空时为空字符串
 */
function joinLocalPath(rootDir: string, relativePath: string): string {
  if (!rootDir || !relativePath) return ''
  const separator = rootDir.includes('\\') ? '\\' : '/'
  return `${rootDir.replace(/[\\/]+$/, '')}${separator}${relativePath.replace(/^[\\/]+/, '')}`
}

/**
 * 按 OSS 的 posix 风格拼接根路径与相对路径
 * @param rootDir OSS 发布根路径
 * @param relativePath 相对发布根路径的路径
 * @returns 拼接后的完整 OSS 路径，任一项为空时为空字符串
 */
function joinOssPath(rootDir: string, relativePath: string): string {
  if (!rootDir || !relativePath) return ''
  return `${rootDir.replace(/^\/+|\/+$/g, '')}/${relativePath.replace(/^\/+/, '')}`
}

// 表单实例
const formRef = ref<FormInstance>()
// 是否正在读取配置
const loading = ref(true)
// 是否正在保存配置
const saving = ref(false)
// 表单数据
const settingForm = ref<ISetting>(createEmptySetting())
// 已保存配置的快照（序列化值）：既用于判断是否有未保存改动，也用于还原
const savedSnapshot = ref('')

// 是否存在未保存的修改
const isDirty = computed(() => JSON.stringify(settingForm.value) !== savedSnapshot.value)

// 完整本地 .secret 目录预览
const localSecretDirPreview = computed(() =>
  joinLocalPath(settingForm.value.localAssets.rootDir, settingForm.value.localAssets.secretDir)
)
// OSS 版本清单完整路径预览
const versionManifestPreview = computed(() =>
  joinOssPath(settingForm.value.ossAssets.rootDir, settingForm.value.ossAssets.versionManifestPath)
)
// OSS .secret 文件完整路径预览
const ossSecretPreview = computed(() =>
  joinOssPath(settingForm.value.ossAssets.rootDir, settingForm.value.ossAssets.secretPath)
)

/**
 * 表单校验规则：路径全部必填，留空时对应发布环节必定失败
 */
const rules: FormRules = {
  'localAssets.rootDir': [{ required: true, message: '请选择或填写本地根目录', trigger: 'blur' }],
  'localAssets.secretDir': [
    { required: true, message: '请填写 .secret 目录，如 .secret', trigger: 'blur' }
  ],
  'ossAssets.rootDir': [{ required: true, message: '请填写 OSS 发布根路径', trigger: 'blur' }],
  'ossAssets.versionManifestPath': [
    { required: true, message: '请填写版本清单文件路径', trigger: 'blur' }
  ],
  'ossAssets.secretPath': [{ required: true, message: '请填写 .secret 文件路径', trigger: 'blur' }]
}

/**
 * 读取当前配置
 * @returns 读取完成的 Promise
 */
async function fetchSetting(): Promise<void> {
  loading.value = true
  try {
    const setting = await electronApi.publish.getSetting()
    settingForm.value = setting
    savedSnapshot.value = JSON.stringify(setting)
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error, '获取配置失败'))
  } finally {
    loading.value = false
  }
}

/**
 * 选择目录并写入指定字段
 *
 * 取消选择时得到空路径，保持原值不动
 * @param setter 把选到的目录写到目标字段上的函数
 * @returns 选择完成的 Promise
 */
async function handlePickDirectory(setter: (path: string) => void): Promise<void> {
  const directoryPath = await pickDirectoryPath()
  if (directoryPath) setter(directoryPath)
}

/**
 * 保存配置
 * @returns 保存完成的 Promise
 */
async function handleSave(): Promise<void> {
  const form = formRef.value
  if (!form) return
  const valid = await form.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请先补全必填的路径配置')
    return
  }
  saving.value = true
  try {
    const setting = await electronApi.publish.updateSetting(settingForm.value)
    settingForm.value = setting
    savedSnapshot.value = JSON.stringify(setting)
    ElMessage.success('配置已保存')
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error, '保存配置失败'))
  } finally {
    saving.value = false
  }
}

/**
 * 还原到最近一次保存的配置
 *
 * 配置读取失败时没有可用快照，此时不做还原，避免把表单清成一个畸形状态
 */
function handleReset(): void {
  if (!savedSnapshot.value) return
  settingForm.value = JSON.parse(savedSnapshot.value) as ISetting
  formRef.value?.clearValidate()
}

onMounted(() => {
  void fetchSetting()
})
</script>

<template>
  <div class="config-management">
    <el-alert
      class="config-management__tip"
      type="info"
      show-icon
      :closable="false"
      title="配置保存在本地，保存后立即对后续发布生效；路径填错时对应的发布环节会直接失败"
    />

    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="config-management__header">
          <span class="config-management__title">发布资源配置</span>
          <el-tag v-if="isDirty" type="warning" size="small" effect="light">有未保存的修改</el-tag>
          <div class="config-management__actions">
            <el-button :disabled="!isDirty" @click="handleReset">还原</el-button>
            <el-button
              type="primary"
              :loading="saving"
              :disabled="!isDirty"
              @click="handleSave"
            >
              保存配置
            </el-button>
          </div>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="settingForm"
        :rules="rules"
        label-width="150px"
        @submit.prevent
      >
        <section class="setting-section">
          <h3 class="setting-section__title">本地资源</h3>
          <p class="setting-section__desc">
            产物压缩与本地密钥都以此为基准目录，均按本机路径处理
          </p>

          <el-form-item label="本地根目录" prop="localAssets.rootDir">
            <el-input
              v-model="settingForm.localAssets.rootDir"
              placeholder="请选择或填写本地资源根目录"
              clearable
            >
              <template #append>
                <el-button
                  :icon="Folder"
                  @click="handlePickDirectory((path) => (settingForm.localAssets.rootDir = path))"
                >
                  选择
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label=".secret 目录" prop="localAssets.secretDir">
            <el-input
              v-model="settingForm.localAssets.secretDir"
              placeholder="相对本地根目录，如 .secret"
              clearable
            />
            <p class="setting-section__hint">
              推荐填写相对本地根目录的路径；填绝对路径时以绝对路径为准
            </p>
          </el-form-item>

          <p v-if="localSecretDirPreview" class="setting-section__preview">
            拼接后的完整目录：{{ localSecretDirPreview }}
          </p>
        </section>

        <section class="setting-section">
          <h3 class="setting-section__title">OSS 资源</h3>
          <p class="setting-section__desc">
            均为 OSS 上的虚拟路径（posix 风格），不以斜杠开头；其他路径相对发布根路径
          </p>

          <el-form-item label="发布根路径" prop="ossAssets.rootDir">
            <el-input
              v-model="settingForm.ossAssets.rootDir"
              placeholder="如 MyHome"
              clearable
            />
            <p class="setting-section__hint">
              项目产物按「发布根路径 / 项目类型 / 项目名称」分目录存放
            </p>
          </el-form-item>

          <el-form-item label="版本清单路径" prop="ossAssets.versionManifestPath">
            <el-input
              v-model="settingForm.ossAssets.versionManifestPath"
              placeholder="如 ./versionManifest.json"
              clearable
            />
            <p v-if="versionManifestPreview" class="setting-section__preview">
              拼接后的完整路径：{{ versionManifestPreview }}
            </p>
          </el-form-item>

          <el-form-item label=".secret 文件路径" prop="ossAssets.secretPath">
            <el-input
              v-model="settingForm.ossAssets.secretPath"
              placeholder="如 ./.secret.zip"
              clearable
            />
            <p v-if="ossSecretPreview" class="setting-section__preview">
              拼接后的完整路径：{{ ossSecretPreview }}
            </p>
          </el-form-item>
        </section>

        <section class="setting-section">
          <h3 class="setting-section__title">Android Studio</h3>
          <p class="setting-section__desc">
            仅发布 Android 项目时用到，未配置该类项目时可留空
          </p>

          <el-form-item label="JDK 路径">
            <el-input
              v-model="settingForm.androidStudio.jdkPath"
              placeholder="请选择或填写 JDK 根目录"
              clearable
            >
              <template #append>
                <el-button
                  :icon="Folder"
                  @click="
                    handlePickDirectory((path) => (settingForm.androidStudio.jdkPath = path))
                  "
                >
                  选择
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="SDK 路径">
            <el-input
              v-model="settingForm.androidStudio.sdkPath"
              placeholder="请选择或填写 Android SDK 根目录"
              clearable
            >
              <template #append>
                <el-button
                  :icon="Folder"
                  @click="
                    handlePickDirectory((path) => (settingForm.androidStudio.sdkPath = path))
                  "
                >
                  选择
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </section>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.config-management {
  &__tip {
    margin-bottom: 16px;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    margin-left: auto;
    gap: 8px;
  }
}

.setting-section {
  padding-bottom: 8px;

  & + & {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  &__desc {
    margin: 6px 0 16px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__hint {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
  }

  &__preview {
    margin: 4px 0 0;
    color: var(--el-color-primary);
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
