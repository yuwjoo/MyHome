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

    <!-- 0. 版本清单 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="manifest-header">
          <span class="card-title">版本清单</span>
          <el-button
            type="primary"
            :loading="publishingManifest"
            @click="handlePublishManifest"
          >
            {{ publishingManifest ? '更新中...' : '更新版本清单' }}
          </el-button>
        </div>
      </template>
      <div class="manifest-list" v-loading="manifestLoading">
        <div
          v-for="proj in projectEntries"
          :key="proj.id"
          class="manifest-item"
        >
          <span class="manifest-dot" :style="{ background: platformColor[proj.platform] }" />
          <span class="manifest-platform-label">{{ platformLabel[proj.platform] }}</span>
          <span class="manifest-project-name">{{ proj.name }}</span>
          <el-tag type="info" size="small" effect="plain">v{{ proj.version }}</el-tag>
        </div>
        <div v-if="!manifestLoading && projectEntries.length === 0" class="manifest-empty">
          <span class="manifest-empty-icon">
            <IconInfo />
          </span>
          <span>暂无版本信息</span>
        </div>
      </div>
    </el-card>

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
        :task="taskForBuild"
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

import { useVersionManifest } from '@/composables/useVersionManifest';
import { useWebPublish } from '@/composables/useWebPublish';
import { useAndroidPublish } from '@/composables/useAndroidPublish';
import { bridge } from '@/module/bridge';
import { getProjectById, projectList, platformLabel, platformColor } from '@/config/projects';
import type { PublishTask } from '@/types/useWebPublish';

// -- 版本清单 Hook --
const {
  manifest,
  loading: manifestLoading,
  loadManifest,
  getProjectVersion,
  updateVersion,
} = useVersionManifest();

// -- Web 发布 Hook --
const webPublish = useWebPublish();

// -- Android 发布 Hook --
const androidPublish = useAndroidPublish();

/** 当前平台对应的发布 Hook 状态（动态指向 web/android） */
const currentTask = computed(() => webPublish.currentTask.value || androidPublish.currentTask.value);
const isPublishing = computed(() => webPublish.isPublishing.value || androidPublish.isPublishing.value);

/** Ref 自动解包后的任务对象，解决 TS 插件类型推断问题 */
const taskForBuild = computed(() => currentTask.value);

// -- 版本清单发布状态 --
const publishingManifest = ref(false);

// -- 表单数据 --
const form = reactive({
  projectId: '',
  version: '0.0.0',
});

/** 从 manifest 计算各项目条目（供版本清单展示） */
const projectEntries = computed(() => {
  return projectList.map((p) => {
    const [platform, projectName] = p.manifestKey.split('.');
    const version = manifest.value[platform]?.[projectName] || '-';
    return {
      id: p.id,
      name: p.name,
      platform: p.platform,
      version,
    };
  });
});

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

/**
 * 发布版本清单：通过 bridge 覆盖本地文件并上传 OSS
 */
const handlePublishManifest = () => {
  publishingManifest.value = true;
  bridge.send('versionManifest', 'publishManifest', { manifest: manifest.value }, {
    onSuccess: () => {
      ElMessage.success('版本清单发布成功');
      publishingManifest.value = false;
    },
    onError: (data) => {
      ElMessage.error(`版本清单发布失败: ${data.message}`);
      publishingManifest.value = false;
    },
  });
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

  // 根据平台选择对应的发布 Hook
  const publishHook = project.platform === 'android' ? androidPublish : webPublish;

  try {
    await publishHook.startPublish(task);
  } catch {
    // 错误日志已在 hook 内部输出
  }

  // 发布成功后更新内存中的版本清单
  if (task.status === 'success') {
    updateVersion(form.projectId, form.version);
  }
};

/** 取消发布 */
const handleCancel = () => {
  webPublish.cancelPublish();
  androidPublish.cancelPublish();
};

/** 清空日志 */
const handleClearLogs = () => {
  webPublish.clearLogs();
  androidPublish.clearLogs();
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

  .manifest-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .manifest-list {
    .manifest-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;

      &:not(:last-child) {
        border-bottom: 1px solid #ebeef5;
      }

      .manifest-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .manifest-platform-label {
        flex-shrink: 0;
        width: 100px;
        font-size: 14px;
        color: #606266;
        font-weight: 500;
      }

      .manifest-project-name {
        flex: 1;
        font-size: 14px;
        color: #303133;
      }
    }

    .manifest-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 0;
      color: #c0c4cc;
      font-size: 14px;

      .manifest-empty-icon {
        font-size: 32px;
      }
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
