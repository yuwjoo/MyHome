<!--
  @file 项目卡片组件
  @description 展示单个项目的版本与路径信息、实时发布进度，并提供版本号调整、发布 / 中止与项目维护入口
-->
<script setup lang="ts">
import { computed } from 'vue'
import { Delete, Document, Edit, Promotion, Refresh, VideoPause } from '@element-plus/icons-vue'
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import type { IPublishLogItem } from '../types/publish'
import { publishControllerLabels } from '../utils/project'
import { listStages, resolveStageIndex, stageMeta } from '../utils/stage'
import { resolveNextVersion } from '../utils/version'

defineOptions({ name: 'projectCard' })

/**
 * 组件属性
 */
const props = defineProps<{
  /** 项目信息 */
  project: IProjectInfo
  /** 本次发布的目标版本号（由父组件持有，便于发布后自动推进到下一版） */
  targetVersion: string
  /** 该项目是否正在发布 */
  publishing: boolean
  /** 该项目最新一条日志，用于展示当前动作，没有日志时为 null */
  latestLog: IPublishLogItem | null
  /** 该项目累计日志条数 */
  logCount: number
}>()

/**
 * 组件事件
 */
const emit = defineEmits<{
  /** 修改目标版本号 */
  (event: 'update:targetVersion', value: string): void
  /** 按当前目标版本号发布 */
  (event: 'publish', targetVersion: string): void
  /** 中止当前发布 */
  (event: 'abort'): void
  /** 编辑项目 */
  (event: 'edit'): void
  /** 删除项目 */
  (event: 'remove'): void
  /** 查看该项目日志 */
  (event: 'viewLog'): void
}>()

// 发布流程的全部阶段，用于渲染步骤条
const stages = listStages()
// 发布控制器展示名称
const controllerLabel = computed(
  () => publishControllerLabels[props.project.publishController] ?? props.project.publishController
)
// 当前阶段在流程中的序号，未开始或日志已清空时为 -1
const stageIndex = computed(() => (props.latestLog ? resolveStageIndex(props.latestLog.stage) : -1))

/**
 * 同步目标版本号输入
 * @param value 输入框最新值
 */
function handleVersionInput(value: string | number): void {
  emit('update:targetVersion', String(value).trim())
}

/**
 * 一键填入下一版本号：在当前最新版本基础上末段加一
 */
function fillNextVersion(): void {
  emit('update:targetVersion', resolveNextVersion(props.project.latestVersion))
}
</script>

<template>
  <el-card class="project-card" shadow="hover">
    <template #header>
      <div class="project-card__header">
        <span class="project-card__name" :title="project.projectName">
          {{ project.projectName }}
        </span>
        <el-tag v-if="publishing" type="primary" size="small" effect="dark">发布中</el-tag>
      </div>
      <div class="project-card__tags">
        <el-tag size="small" effect="plain">{{ project.projectType }}</el-tag>
        <el-tag size="small" type="info" effect="plain">{{ controllerLabel }}</el-tag>
      </div>
    </template>

    <div class="project-card__body">
      <div class="project-card__row">
        <span class="project-card__label">当前版本</span>
        <el-tag type="success" size="small" effect="plain">
          v{{ project.latestVersion || '未设置' }}
        </el-tag>
      </div>

      <div class="project-card__row">
        <span class="project-card__label">项目路径</span>
        <span class="project-card__path" :title="project.projectPath">
          {{ project.projectPath || '未设置' }}
        </span>
      </div>

      <div class="project-card__row project-card__row--version">
        <span class="project-card__label">目标版本</span>
        <el-input
          class="project-card__version-input"
          :model-value="targetVersion"
          size="small"
          placeholder="如 1.0.0"
          :disabled="publishing"
          @update:model-value="handleVersionInput"
        >
          <template #append>
            <el-button :icon="Refresh" :disabled="publishing" @click="fillNextVersion">
              下一版
            </el-button>
          </template>
        </el-input>
      </div>

      <template v-if="publishing">
        <!-- 不指定固定步长，让各节点在卡片宽度内自适应分配，窄卡片下标题不相互重叠 -->
        <el-steps class="project-card__steps" :active="stageIndex" finish-status="success">
          <el-step v-for="stage in stages" :key="stage" :title="stageMeta[stage].label" />
        </el-steps>
        <p class="project-card__latest-log">
          <el-tag size="small" :type="latestLog ? stageMeta[latestLog.stage].type : 'info'">
            {{ latestLog ? stageMeta[latestLog.stage].label : '准备' }}
          </el-tag>
          <span class="project-card__latest-message">{{
            latestLog?.message ?? '正在启动发布流程'
          }}</span>
        </p>
      </template>
    </div>

    <div class="project-card__footer">
      <el-button
        type="primary"
        size="small"
        :icon="Promotion"
        :loading="publishing"
        @click="emit('publish', targetVersion)"
      >
        {{ publishing ? '发布中' : '发布' }}
      </el-button>
      <el-button
        size="small"
        type="danger"
        plain
        :icon="VideoPause"
        :disabled="!publishing"
        @click="emit('abort')"
      >
        中止
      </el-button>
      <el-button size="small" :icon="Document" @click="emit('viewLog')">
        日志{{ logCount ? `(${logCount})` : '' }}
      </el-button>
      <el-button size="small" :icon="Edit" :disabled="publishing" @click="emit('edit')" />
      <el-button
        size="small"
        type="danger"
        :icon="Delete"
        :disabled="publishing"
        @click="emit('remove')"
      />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.project-card {
  display: flex;
  height: 100%;
  flex-direction: column;

  :deep(.el-card__header) {
    padding: 12px 16px 8px;
  }

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 0 16px 12px;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* min-width: 0 是 flex 项能真正收缩的前置条件，缺了它长文本会把行撑破而不是出现省略号 */
  &__name {
    overflow: hidden;
    min-width: 0;
    font-size: 15px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tags {
    display: flex;
    margin-top: 8px;
    gap: 6px;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;

    &--version {
      align-items: center;
    }
  }

  &__label {
    flex-shrink: 0;
    width: 60px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__path {
    overflow: hidden;
    min-width: 0;
    color: var(--el-text-color-regular);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__version-input {
    flex: 1;
    min-width: 0;
  }

  &__steps {
    margin: 4px 0;
    padding: 0;
  }

  &__latest-log {
    display: flex;
    align-items: center;
    margin: 0;
    gap: 6px;
  }

  &__latest-message {
    overflow: hidden;
    min-width: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__footer {
    display: flex;
    align-items: center;
    margin-top: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
