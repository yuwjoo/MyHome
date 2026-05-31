<template>
  <div class="publish-view">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <h2>
        <el-icon><UploadFilled /></el-icon>
        MyHome 项目构建发布
      </h2>
      <p class="page-desc">统一管理 MyHome 各端项目的构建与发布流程</p>
    </div>

    <!-- 主内容区 -->
    <div class="page-content">
      <!-- 左侧：发布配置表单 -->
      <div class="publish-panel">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">📋 发布配置</span>
          </template>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
            label-position="right"
            size="default"
            :disabled="isBuilding"
          >
            <!-- 项目选择 -->
            <ProjectSelector v-model="form.projectId" />

            <!-- 构建环境 -->
            <BuildEnvSelector v-model="form.env" />

            <!-- 版本号 -->
            <VersionInput v-model="form.version" />

            <!-- 发布选项 -->
            <PublishOptions
              v-model:description="form.description"
              v-model:auto-publish="form.autoPublish"
            />

            <!-- 操作按钮 -->
            <el-form-item>
              <el-button
                type="primary"
                :loading="isBuilding"
                :icon="UploadFilled"
                size="large"
                @click="handlePublish"
              >
                {{ isBuilding ? '构建中...' : '开始构建' }}
              </el-button>
              <el-button
                v-if="isBuilding"
                type="danger"
                size="large"
                @click="handleCancel"
              >
                取消构建
              </el-button>
              <el-button
                :disabled="isBuilding"
                size="large"
                @click="handleReset"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 右侧：构建进度 + 日志 -->
      <div class="status-panel">
        <!-- 构建进度 -->
        <el-card shadow="hover" class="progress-card">
          <BuildProgress :task="currentTask" />
        </el-card>

        <!-- 构建日志 -->
        <el-card shadow="hover" class="log-card">
          <BuildLogViewer
            :logs="currentTask?.logs ?? []"
            @clear="handleClearLogs"
          />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 发布主页面
 * 集成项目选择、环境配置、版本管理、构建执行与日志展示
 */
import { UploadFilled } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

import ProjectSelector from '@/components/ProjectSelector.vue';
import BuildEnvSelector from '@/components/BuildEnvSelector.vue';
import VersionInput from '@/components/VersionInput.vue';
import PublishOptions from '@/components/PublishOptions.vue';
import BuildProgress from '@/components/BuildProgress.vue';
import BuildLogViewer from '@/components/BuildLogViewer.vue';

import { usePublishForm } from '@/hooks/usePublishForm';
import { useBuildExecutor } from '@/hooks/useBuildExecutor';

// -- 表单 Hook --
const { form, formRef, rules, validate, resetForm } = usePublishForm();

// -- 构建执行 Hook --
const { currentTask, isBuilding, executeBuild, cancelBuild } = useBuildExecutor();

/**
 * 处理发布/构建操作
 * 先校验表单，通过后执行构建
 */
const handlePublish = async () => {
  try {
    const formData = await validate();

    // 生产环境二次确认
    if (formData.env === 'prod') {
      await ElMessageBox.confirm(
        '您即将执行生产环境构建，确定要继续吗？',
        '生产环境确认',
        {
          confirmButtonText: '确定构建',
          cancelButtonText: '取消',
          type: 'warning',
        },
      );
    }

    await executeBuild(formData);
  } catch {
    // 校验失败或用户取消，不做处理
  }
};

/** 取消构建 */
const handleCancel = () => {
  cancelBuild();
};

/** 重置表单 */
const handleReset = () => {
  resetForm();
};

/** 清空日志 */
const handleClearLogs = () => {
  if (currentTask.value) {
    currentTask.value.logs = [];
  }
};
</script>

<style lang="scss" scoped>
.publish-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: auto;

  .page-header {
    margin-bottom: 24px;

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 22px;
      color: #303133;
      margin-bottom: 8px;
    }

    .page-desc {
      font-size: 14px;
      color: #909399;
      margin-left: 32px;
    }
  }

  .page-content {
    flex: 1;
    display: grid;
    grid-template-columns: 480px 1fr;
    gap: 24px;
    min-height: 0;

    .publish-panel {
      min-height: 0;

      .card-title {
        font-weight: 600;
        font-size: 15px;
      }

      :deep(.el-form-item:last-child) {
        margin-bottom: 0;
        padding-top: 8px;
      }
    }

    .status-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 0;

      .progress-card {
        flex-shrink: 0;
      }

      .log-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;

        :deep(.el-card__body) {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 0;
        }
      }
    }
  }
}
</style>
