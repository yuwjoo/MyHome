<template>
  <div class="build-progress">
    <div class="progress-header">
      <h4>发布进度</h4>
      <el-tag :type="statusTagType" size="small">
        {{ statusLabel }}
      </el-tag>
    </div>

    <el-progress
      :percentage="task?.progress ?? 0"
      :status="progressStatus"
      :stroke-width="18"
      :text-inside="true"
    />

    <div v-if="task" class="progress-meta">
      <span>{{ task.version }}</span>
      <span v-if="task.startTime">
        耗时: {{ elapsedTime }}
      </span>
    </div>

    <!-- 发布日志 -->
    <div class="progress-logs">
      <div class="logs-header">
        <span>发布日志</span>
        <div class="logs-actions">
          <el-button text size="small" @click="handleClear">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
          <el-button text size="small" @click="handleCopy">
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
        </div>
      </div>
      <div ref="logContainer" class="log-content">
        <div v-if="task && task.logs.length === 0" class="log-empty">
          暂无发布日志
        </div>
        <div
          v-for="(log, index) in (task?.logs ?? [])"
          :key="index"
          class="log-line"
          :class="`log-${log.level}`"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 发布进度面板组件
 * 展示发布进度、状态、耗时及实时日志
 */
import { computed, ref, watch, nextTick, onUnmounted } from 'vue';
import type { PublishTask, BuildStatus, LogEntry } from '@/types/useWebPublish';

const props = defineProps<{
  task: PublishTask | null;
}>();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const logContainer = ref<HTMLElement | null>(null);
const elapsedSeconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

// 启动计时器
watch(
  () => props.task?.status,
  (status) => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (status === 'publishing' && props.task?.startTime) {
      timer = setInterval(() => {
        if (props.task?.startTime) {
          elapsedSeconds.value = Math.floor((Date.now() - props.task.startTime) / 1000);
        }
      }, 1000);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

/** 状态标签类型 */
const statusTagType = computed(() => {
  const map: Record<BuildStatus, string> = {
    idle: 'info',
    publishing: 'warning',
    success: 'success',
    failed: 'danger',
  };
  return props.task ? map[props.task.status] : 'info';
});

/** 状态文本 */
const statusLabel = computed(() => {
  const map: Record<BuildStatus, string> = {
    idle: '待发布',
    publishing: '发布中',
    success: '发布成功',
    failed: '发布失败',
  };
  return props.task ? map[props.task.status] : '待发布';
});

/** 进度条状态 */
const progressStatus = computed(() => {
  if (!props.task) return undefined;
  if (props.task.status === 'success') return 'success' as const;
  if (props.task.status === 'failed') return 'exception' as const;
  return undefined;
});

/** 格式化耗时 */
const elapsedTime = computed(() => {
  const secs = elapsedSeconds.value;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}分${s}秒`;
});

/** 格式化时间戳 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour12: false });
};

/** 清空日志 */
const handleClear = () => {
  emit('clear');
};

/** 复制日志 */
const handleCopy = async () => {
  const logs = props.task?.logs ?? [];
  const text = logs
    .map((log) => `[${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}`)
    .join('\n');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
};

/** 自动滚动到底部 */
watch(
  () => props.task?.logs.length,
  async () => {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  },
);
</script>

<style lang="scss" scoped>
.build-progress {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      font-size: 15px;
      color: #303133;
    }
  }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }

  .progress-logs {
    margin-top: 16px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;

    .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;
      font-size: 13px;
      font-weight: 600;
      color: #606266;

      .logs-actions {
        display: flex;
        gap: 4px;
      }
    }

    .log-content {
      height: 180px;
      overflow-y: auto;
      padding: 8px 12px;
      background: #1e1e1e;
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: 12px;
      line-height: 1.6;

      .log-empty {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #858585;
        font-family: inherit;
      }

      .log-line {
        display: flex;
        gap: 12px;
        white-space: pre-wrap;
        word-break: break-all;

        .log-time {
          color: #858585;
          flex-shrink: 0;
        }

        .log-msg {
          color: #d4d4d4;
        }

        &.log-warn .log-msg {
          color: #e6a23c;
        }

        &.log-error .log-msg {
          color: #f56c6c;
        }

        &.log-info .log-msg {
          color: #67c23a;
        }
      }
    }
  }
}
</style>
