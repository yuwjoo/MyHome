<template>
  <el-card shadow="hover" class="section-card">
    <template #header>
      <div class="panel-header">
        <div class="panel-identity">
          <span class="panel-dot" style="background: #409EFF" />
          <span class="panel-platform">Web 移动端</span>
          <span class="panel-name">my-home-mobile</span>
        </div>
      </div>
    </template>

    <div class="panel-body">
      <!-- 版本信息 -->
      <div class="version-section">
        <div class="version-row">
          <div class="version-label">当前最新版本</div>
          <div class="version-value">
            <el-tag type="info" size="large" effect="plain">
              {{ currentVersion }}
            </el-tag>
          </div>
        </div>
        <el-divider />
        <div class="version-row">
          <div class="version-label">发布版本号</div>
          <div class="version-editor">
            <VersionInput v-model="version" />
          </div>
        </div>
      </div>

      <!-- 发布操作 -->
      <div class="action-section">
        <div class="action-info">
          <span>发布将执行 npm run build 并更新版本清单</span>
        </div>
        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            :loading="isPublishing"
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

      <!-- 发布进度 -->
      <BuildProgress
        :task="taskForBuild"
        @clear="handleClearLogs"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import IconPublish from '~icons/my/publish';

import VersionInput from '@/components/VersionInput.vue';
import BuildProgress from '@/components/BuildProgress.vue';

import { useWebPublish } from '@/composables/useWebPublish';
import type { PublishTask } from '@/types/useWebPublish';

const props = defineProps<{
  currentVersion: string;
}>();

const emit = defineEmits<{
  (e: 'version-updated', version: string): void;
}>();

const webPublish = useWebPublish();

const { currentTask, isPublishing, startPublish, cancelPublish, clearLogs } = webPublish;

/** Ref 自动解包后的任务对象，解决 TS 插件类型推断问题 */
const taskForBuild = computed(() => currentTask.value);

const version = ref(props.currentVersion);

// 当外部版本变化时同步
watch(
  () => props.currentVersion,
  (v) => {
    version.value = v;
  },
);

/** 处理发布 */
const handlePublish = async () => {
  try {
    await ElMessageBox.confirm(
      `确认发布 Web 移动端 - my-home-mobile，版本号: ${version.value}`,
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

  const task: PublishTask = {
    id: `publish_web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId: 'web-myhome',
    version: version.value,
    status: 'publishing',
    progress: 0,
    logs: [],
    startTime: Date.now(),
  };

  try {
    await startPublish(task);
  } catch {
    // 错误已在 hook 内部处理
  }

  if (task.status === 'success') {
    emit('version-updated', version.value);
  }
};

/** 取消发布 */
const handleCancel = () => {
  cancelPublish();
};

/** 清空日志 */
const handleClearLogs = () => {
  clearLogs();
};
</script>

<style lang="scss" scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-identity {
  display: flex;
  align-items: center;
  gap: 10px;

  .panel-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .panel-platform {
    font-weight: 600;
    font-size: 15px;
    color: #303133;
  }

  .panel-name {
    font-size: 13px;
    color: #909399;
  }
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 16px;

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
