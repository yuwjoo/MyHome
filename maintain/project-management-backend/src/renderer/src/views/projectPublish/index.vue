<!--
  @file 项目发布页
  @description 以卡片形式维护本地项目：增删改项目、指定目标版本发布 / 中止发布，并实时展示发布日志
-->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Document, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import type { ISetting } from '@shared/types/ipc/publish'
import { resolveErrorMessage } from '@renderer/utils/error'
import { electronApi } from '@renderer/utils/electronApi'
import ProjectCard from './components/ProjectCard.vue'
import ProjectFormDialog from './components/ProjectFormDialog.vue'
import PublishLogDrawer from './components/PublishLogDrawer.vue'
import { usePublishLog } from './hooks/usePublishLog'
import type { IPublishLogItem } from './types/publish'
import { resolveProjectKey } from './utils/project'
import { isValidVersion, resolveNextVersion } from './utils/version'

defineOptions({ name: 'projectPublish' })

const router = useRouter()

// 本地项目列表
const projects = ref<IProjectInfo[]>([])
// 是否正在加载项目列表
const loading = ref(true)
// 搜索关键字：匹配项目名称 / 类型 / 路径
const keyword = ref('')
// 项目类型筛选值，空表示全部类型
const filterType = ref('')
// 发布资源配置，仅用于提示配置是否完整
const setting = ref<ISetting | null>(null)
// 项目弹窗是否展示
const formVisible = ref(false)
// 正在修改的项目，为空表示新增
const editingProject = ref<IProjectInfo | null>(null)
// 是否正在保存项目
const submitting = ref(false)
// 各项目的目标版本号草稿：发布成功后清掉该草稿，自动推进到下一版
const versionDrafts = ref<Record<string, string>>({})
// 正在发布的项目：key 为项目标识，value 为本次发布的目标版本号
const publishingMap = reactive<Record<string, string>>({})
// 日志抽屉是否展示
const logVisible = ref(false)
// 日志抽屉聚焦的项目，为空表示查看全部项目日志
const logTargetKey = ref('')

const { logsOf, clearLogs, clearAllLogs, allLogs, logCount } = usePublishLog()

// 项目类型选项：从现有项目去重得出
const typeOptions = computed(() => [...new Set(projects.value.map((item) => item.projectType))])
// 经过关键字与类型过滤后的项目列表
const filteredProjects = computed(() => {
  const searchKey = keyword.value.trim().toLowerCase()
  return projects.value.filter((project) => {
    const matchType = !filterType.value || project.projectType === filterType.value
    const matchKeyword =
      !searchKey ||
      [project.projectName, project.projectType, project.projectPath].some((field) =>
        field.toLowerCase().includes(searchKey)
      )
    return matchType && matchKeyword
  })
})
// 为空的文本提示：区分「还没有项目」与「筛选无结果」
const emptyDescription = computed(() =>
  projects.value.length ? '没有匹配的项目，试试调整搜索条件' : '还没有项目，先新增一个吧'
)
// 配置里为空的项：留空时对应发布环节必定失败，进入页面即提示
const missingConfigs = computed(() => {
  const current = setting.value
  if (!current) return []
  const missing: string[] = []
  if (!current.localAssets.rootDir) missing.push('本地根目录')
  if (!current.localAssets.secretDir) missing.push('本地 .secret 目录')
  if (!current.ossAssets.rootDir) missing.push('OSS 发布根路径')
  if (!current.ossAssets.versionManifestPath) missing.push('OSS 版本清单路径')
  if (!current.ossAssets.secretPath) missing.push('OSS .secret 文件路径')
  return missing
})
// 日志抽屉标题
const logDrawerTitle = computed(() =>
  logTargetKey.value ? `发布日志 · ${logTargetKey.value}` : '发布日志 · 全部项目'
)
// 日志抽屉数据：聚焦某项目时只看该项目，否则看全部
const currentLogs = computed<IPublishLogItem[]>(() =>
  logTargetKey.value ? logsOf(logTargetKey.value) : allLogs.value
)

/**
 * 补齐缺失的目标版本号草稿
 *
 * 首次出现的项目默认填「下一版本号」，用户手改过的项目保持原样
 * @param list 最新项目列表
 */
function syncVersionDrafts(list: IProjectInfo[]): void {
  list.forEach((project) => {
    const projectKey = resolveProjectKey(project)
    if (!versionDrafts.value[projectKey]) {
      versionDrafts.value[projectKey] = resolveNextVersion(project.latestVersion)
    }
  })
}

/**
 * 读取本地项目列表
 * @returns 读取完成的 Promise
 */
async function fetchProjectList(): Promise<void> {
  loading.value = true
  try {
    const list = await electronApi.publish.getLocalProjectList()
    projects.value = list
    syncVersionDrafts(list)
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error, '获取项目列表失败'))
  } finally {
    loading.value = false
  }
}

/**
 * 读取发布资源配置（仅用于配置完整性提示）
 * @returns 读取完成的 Promise
 */
async function fetchSetting(): Promise<void> {
  try {
    setting.value = await electronApi.publish.getSetting()
  } catch {
    // 读取失败不影响发布页主流程，仅失去配置不完整的引导
    setting.value = null
  }
}

/**
 * 取某项目的目标版本号草稿
 * @param project 项目信息
 * @returns 目标版本号，尚未生成草稿时为空字符串
 */
function draftVersion(project: IProjectInfo): string {
  return versionDrafts.value[resolveProjectKey(project)] ?? ''
}

/**
 * 记录某项目的目标版本号草稿
 * @param project 项目信息
 * @param version 最新输入的目标版本号
 */
function handleVersionUpdate(project: IProjectInfo, version: string): void {
  versionDrafts.value[resolveProjectKey(project)] = version
}

/**
 * 取某项目最新一条日志
 * @param project 项目信息
 * @returns 最新日志，没有日志时为 null
 */
function latestLogOf(project: IProjectInfo): IPublishLogItem | null {
  const logs = logsOf(resolveProjectKey(project))
  return logs.length ? logs[logs.length - 1] : null
}

/**
 * 发布项目
 *
 * 发布期间锁定该项目并在日志抽屉里跟进整个过程；成功后刷新列表以同步最新版本号，
 * 无论成败都在结束时解除发布状态
 * @param project 项目信息
 * @param targetVersion 目标版本号
 * @returns 发布完成的 Promise
 */
async function handlePublish(project: IProjectInfo, targetVersion: string): Promise<void> {
  const projectKey = resolveProjectKey(project)
  const version = targetVersion.trim()
  if (!version) {
    ElMessage.warning('请先填写目标版本号')
    return
  }
  if (!isValidVersion(version)) {
    ElMessage.warning('版本号须为点分数字，如 1.2.3')
    return
  }
  if (publishingMap[projectKey]) {
    ElMessage.warning(`项目「${projectKey}」正在发布中`)
    return
  }
  publishingMap[projectKey] = version
  logTargetKey.value = projectKey
  logVisible.value = true
  try {
    await electronApi.publish.publishProject(project.projectType, project.projectName, version)
    ElMessage.success(`发布成功：${projectKey} v${version}`)
    delete versionDrafts.value[projectKey]
    await fetchProjectList()
  } catch (error) {
    ElMessage({
      type: 'error',
      message: resolveErrorMessage(error, `发布失败：${projectKey}`),
      duration: 6000,
      showClose: true
    })
  } finally {
    delete publishingMap[projectKey]
  }
}

/**
 * 中止正在进行的发布
 * @param project 项目信息
 * @returns 中止完成的 Promise
 */
async function handleAbort(project: IProjectInfo): Promise<void> {
  const projectKey = resolveProjectKey(project)
  try {
    const aborted = await electronApi.publish.abortPublish(project.projectType, project.projectName)
    if (aborted) {
      ElMessage.success(`已发起中止：${projectKey}`)
      return
    }
    ElMessage.warning('该项目当前不在发布中，或所处阶段不支持中止')
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error, `中止失败：${projectKey}`))
  }
}

/**
 * 打开新增项目弹窗
 */
function openCreate(): void {
  editingProject.value = null
  formVisible.value = true
}

/**
 * 打开修改项目弹窗
 * @param project 待修改的项目
 */
function openEdit(project: IProjectInfo): void {
  editingProject.value = { ...project }
  formVisible.value = true
}

/**
 * 保存项目（新增或修改）
 * @param project 表单提交的项目信息
 * @returns 保存完成的 Promise
 */
async function handleFormSubmit(project: IProjectInfo): Promise<void> {
  submitting.value = true
  try {
    await electronApi.publish.saveLocalProject(project)
    ElMessage.success(`项目已保存：${resolveProjectKey(project)}`)
    formVisible.value = false
    await fetchProjectList()
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error, '保存项目失败'))
  } finally {
    submitting.value = false
  }
}

/**
 * 删除项目
 *
 * 删除前二次确认；已删除的项目不可恢复
 * @param project 待删除的项目
 * @returns 删除完成的 Promise
 */
async function handleRemove(project: IProjectInfo): Promise<void> {
  const projectKey = resolveProjectKey(project)
  try {
    await ElMessageBox.confirm(`删除后不可恢复，确认删除项目「${projectKey}」？`, '删除项目', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    // 用户取消删除
    return
  }
  try {
    await electronApi.publish.deleteLocalProject(project.projectType, project.projectName)
    ElMessage.success(`项目已删除：${projectKey}`)
    delete versionDrafts.value[projectKey]
    await fetchProjectList()
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error, '删除项目失败'))
  }
}

/**
 * 打开日志抽屉
 * @param projectKey 聚焦的项目标识，传空字符串表示查看全部项目
 */
function openLogDrawer(projectKey: string): void {
  logTargetKey.value = projectKey
  logVisible.value = true
}

/**
 * 清空当前抽屉展示的日志
 */
function handleClearLogs(): void {
  if (logTargetKey.value) {
    clearLogs(logTargetKey.value)
    return
  }
  clearAllLogs()
}

/**
 * 前往配置管理页
 * @returns 跳转完成的 Promise
 */
function goToConfig(): Promise<unknown> {
  return router.push('/configManagement')
}

onMounted(() => {
  void fetchProjectList()
  void fetchSetting()
})
</script>

<template>
  <div class="publish-page">
    <el-alert
      v-if="missingConfigs.length"
      class="publish-page__alert"
      type="warning"
      show-icon
      :closable="false"
    >
      <div class="publish-page__alert-content">
        <span>以下配置尚未填写，发布会在对应环节失败：{{ missingConfigs.join('、') }}</span>
        <el-button link type="primary" @click="goToConfig">前往配置</el-button>
      </div>
    </el-alert>

    <el-card shadow="never" class="publish-page__toolbar">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          class="toolbar__search"
          placeholder="搜索项目名称 / 类型 / 路径"
          clearable
          :prefix-icon="Search"
        />
        <el-select v-model="filterType" class="toolbar__type" placeholder="全部项目类型" clearable>
          <el-option v-for="type in typeOptions" :key="type" :label="type" :value="type" />
        </el-select>
        <div class="toolbar__actions">
          <el-badge :value="logCount" :hidden="!logCount" :max="99">
            <el-button :icon="Document" @click="openLogDrawer('')">全部日志</el-button>
          </el-badge>
          <el-button :icon="Refresh" @click="fetchProjectList">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增项目</el-button>
        </div>
      </div>
    </el-card>

    <!--
      卡片区：自适应列 + 每列最小 320px
      容器变窄时先减列数，减到一列后由内容区横向滚动，避免卡片被压到内部错位
    -->
    <div v-loading="loading" class="publish-page__grid">
      <ProjectCard
        v-for="project in filteredProjects"
        :key="resolveProjectKey(project)"
        :project="project"
        :target-version="draftVersion(project)"
        :publishing="!!publishingMap[resolveProjectKey(project)]"
        :latest-log="latestLogOf(project)"
        :log-count="logsOf(resolveProjectKey(project)).length"
        @update:target-version="handleVersionUpdate(project, $event)"
        @publish="handlePublish(project, $event)"
        @abort="handleAbort(project)"
        @edit="openEdit(project)"
        @remove="handleRemove(project)"
        @view-log="openLogDrawer(resolveProjectKey(project))"
      />
    </div>

    <el-empty v-if="!loading && !filteredProjects.length" :image-size="120">
      <template #description>
        <span>{{ emptyDescription }}</span>
      </template>
      <el-button v-if="!projects.length" type="primary" :icon="Plus" @click="openCreate">
        新增项目
      </el-button>
    </el-empty>

    <PublishLogDrawer
      v-model="logVisible"
      :title="logDrawerTitle"
      :logs="currentLogs"
      :show-project="!logTargetKey"
      @clear="handleClearLogs"
    />

    <ProjectFormDialog
      v-model="formVisible"
      :project="editingProject"
      :projects="projects"
      :submitting="submitting"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.publish-page {
  &__alert {
    margin-bottom: 16px;
  }

  &__alert-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  &__toolbar {
    margin-bottom: 16px;
  }

  /*
   * 卡片栅格：每列不小于 320px
   * auto-fill 会在容器变窄时自动收列，收不动时整块溢出由内容区滚动，卡片内部布局不被压坏
   */
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  &__search {
    flex: 1 1 260px;
    max-width: 100%;
    min-width: 180px;
  }

  &__type {
    flex: 1 1 180px;
    max-width: 100%;
    min-width: 140px;
  }

  &__actions {
    display: flex;
    margin-left: auto;
    align-items: center;
    gap: 12px;
  }
}
</style>
