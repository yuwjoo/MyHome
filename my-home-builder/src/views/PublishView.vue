<template>
  <div class="publish-view">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <h2>
        <span class="header-icon">
          <IconPublish />
        </span>
        MyHome 项目发布
      </h2>
      <p class="page-desc">统一管理 MyHome 各端项目的发布流程</p>
    </div>

    <!-- 1. 选择项目 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <span class="card-title">选择发布项目</span>
      </template>
      <ProjectSelector v-model="form.projectId" />
    </el-card>

    <!-- 2. 版本信息 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <span class="card-title">版本信息</span>
      </template>
      <div v-if="form.projectId" class="version-section">
        <div class="version-row">
          <div class="version-label">当前最新版本</div>
          <div class="version-value">
            <el-tag type="info" size="large" effect="plain">
              {{ currentLatestVersion }}
            </el-tag>
          </div>
        </div>
        <el-divider />
        <div class="version-row">
          <div class="version-label">发布版本号</div>
          <div class="version-editor">
            <VersionInput v-model="form.version" />
          </div>
        </div>
      </div>
      <div v-else class="empty-hint">
        <span class="empty-hint-icon">
          <IconInfo />
        </span>
        <span>请先选择要发布的项目</span>
      </div>
    </el-card>

    <!-- 3. 发布操作 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <span class="card-title">发布操作</span>
      </template>
      <div class="action-section">
        <div class="action-info">
          <span>发布将执行构建程序并更新版本清单</span>
        </div>
        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            :loading="isPublishing"
            :disabled="!form.projectId"
            @click="handlePublish"
          >
            <template #icon>
              <IconPublish />
            </template>
            {{ isPublishing ? '发布中...' : '开始发布' }}
          </el-button>
          <el-button
            v-if="isPublishing"
            type="danger"
            size="large"
            @click="handleCancel"
          >
            取消发布
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 4. 发布进度 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <span class="card-title">发布进度</span>
      </template>
      <BuildProgress
        :task="currentTask"
        @clear="handleClearLogs"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 发布主页面
 * 上下布局：项目选择 → 版本信息 → 发布操作 → 发布进度
 * 使用 unplugin-icons 编译的自定义 SVG 图标替代 Element Plus 图标
 */
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

/** 自定义 SVG 图标 */
import IconPublish from '~icons/my/publish';
import IconInfo from '~icons/my/info';

import ProjectSelector from '@/components/ProjectSelector.vue';
import VersionInput from '@/components/VersionInput.vue';
import BuildProgress from '@/components/BuildProgress.vue';

import { useVersionManifest } from '@/hooks/useVersionManifest';
import { getProjectById } from '@/config/projects';
import type { PublishTask, LogEntry, BuildStatus } from '@/types/publish';

// -- 版本清单 Hook --
const {
  manifest,
  loading: manifestLoading,
  loadManifest,
  getProjectVersion,
  updateVersion,
} = useVersionManifest();

// -- 表单数据 --
const form = reactive({
  projectId: '',
  version: '0.0.0',
});

// -- 发布任务状态 --
const currentTask = ref<PublishTask | null>(null);
const isPublishing = ref(false);

/** 当前选中项目的最新版本号 */
const currentLatestVersion = computed(() => {
  if (!form.projectId) return '0.0.0';
  return getProjectVersion(form.projectId);
});

// 当选中项目变化时，更新发布版本号为当前最新版本
watch(
  () => form.projectId,
  (newId) => {
    if (newId) {
      form.version = getProjectVersion(newId);
    } else {
      form.version = '0.0.0';
    }
  },
);

// 加载版本清单
onMounted(() => {
  loadManifest();
});

/** 添加日志 */
const addLog = (task: PublishTask, level: LogEntry['level'], message: string) => {
  task.logs.push({
    timestamp: Date.now(),
    level,
    message,
  });
};

/** 更新任务状态 */
const setStatus = (task: PublishTask, status: BuildStatus) => {
  task.status = status;
};

/** 模拟发布进度 */
const simulatePublish = async (task: PublishTask) => {
  const project = getProjectById(task.projectId);
  if (!project) return;

  const steps = [
    { message: `📦 准备发布 ${project.platformLabel} - ${project.name}`, progress: 10 },
    { message: `📋 版本号: ${task.version}`, progress: 15 },
    { message: '🔧 执行构建命令...', progress: 30 },
    { message: `⚡ 执行: ${project.buildCommand}`, progress: 40 },
    { message: '📂 工作目录: ' + project.path, progress: 50 },
    { message: '🔨 编译中...', progress: 65 },
    { message: '📦 打包中...', progress: 75 },
    { message: '🚀 发布中...', progress: 85 },
    { message: '📝 更新版本清单...', progress: 92 },
  ];

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    addLog(task, 'info', step.message);
    task.progress = step.progress;
  }

  // 更新版本清单
  await updateVersion(task.projectId, task.version);

  task.progress = 100;
  setStatus(task, 'success');
  addLog(task, 'info', '✅ 发布成功完成');
  ElMessage.success('发布成功');
};

/** 处理发布操作 */
const handlePublish = async () => {
  if (!form.projectId) {
    ElMessage.warning('请选择要发布的项目');
    return;
  }

  const project = getProjectById(form.projectId);
  if (!project) {
    ElMessage.error('未找到项目配置');
    return;
  }

  // 确认发布
  try {
    await ElMessageBox.confirm(
      `确认发布 ${project.platformLabel} - ${project.name}，版本号: ${form.version}`,
      '确认发布',
      {
        confirmButtonText: '确认发布',
        cancelButtonText: '取消',
        type: 'info',
      },
    );
  } catch {
    return;
  }

  // 创建发布任务
  const task: PublishTask = {
    id: `publish_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId: form.projectId,
    version: form.version,
    status: 'publishing',
    progress: 0,
    logs: [],
    startTime: Date.now(),
  };

  currentTask.value = task;
  isPublishing.value = true;

  addLog(task, 'info', `🚀 开始发布 ${project.platformLabel} - ${project.name}`);

  // 执行发布（当前为模拟，后续接入实际构建程序）
  await simulatePublish(task);

  task.endTime = Date.now();
  isPublishing.value = false;
};

/** 取消发布 */
const handleCancel = () => {
  if (currentTask.value) {
    addLog(currentTask.value, 'warn', '⚠️ 发布已被用户取消');
    setStatus(currentTask.value, 'failed');
    isPublishing.value = false;
  }
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
  overflow-y: auto;
  gap: 16px;

  .page-header {
    flex-shrink: 0;

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 22px;
      color: #303133;
      margin-bottom: 8px;
    }

    .header-icon {
      display: flex;
      align-items: center;
      color: #409EFF;
      font-size: 24px;
    }

    .page-desc {
      font-size: 14px;
      color: #909399;
      margin-left: 32px;
    }
  }

  .section-card {
    flex-shrink: 0;

    .card-title {
      font-weight: 600;
      font-size: 15px;
      color: #303133;
    }
  }

  .version-section {
    .version-row {
      display: flex;
      align-items: center;
      gap: 16px;

      .version-label {
        flex-shrink: 0;
        width: 120px;
        font-size: 14px;
        color: #606266;
        font-weight: 500;
      }

      .version-value {
        flex: 1;
      }

      .version-editor {
        flex: 1;
      }
    }
  }

  .empty-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    color: #c0c4cc;
    font-size: 14px;

    .empty-hint-icon {
      font-size: 32px;
    }
  }

  .action-section {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .action-info {
      font-size: 13px;
      color: #909399;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }
  }
}
</style>
