<template>
  <div class="build-log-viewer">
    <div class="log-header">
      <h4>构建日志</h4>
      <div class="log-actions">
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
      <div v-if="logs.length === 0" class="log-empty">
        <el-empty description="暂无构建日志" :image-size="80" />
      </div>
      <div
        v-for="(log, index) in logs"
        :key="index"
        class="log-line"
        :class="`log-${log.level}`"
      >
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span class="log-msg">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 构建日志查看器组件
 * 展示构建过程的实时日志，支持清空和复制
 */
import { ref, watch, nextTick } from 'vue';
import type { LogEntry } from '@/types/useWebPublish';

const props = defineProps<{
  logs: LogEntry[];
}>();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

/** 日志容器引用，用于自动滚动 */
const logContainer = ref<HTMLElement | null>(null);

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
  const text = props.logs
    .map((log) => `[${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}`)
    .join('\n');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 降级方案
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
  () => props.logs.length,
  async () => {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  },
);
</script>

<style lang="scss" scoped>
.build-log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #ebeef5;

    h4 {
      margin: 0;
      font-size: 14px;
      color: #303133;
    }

    .log-actions {
      display: flex;
      gap: 4px;
    }
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    background: #1e1e1e;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.6;
    min-height: 200px;
    max-height: 400px;

    .log-empty {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
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
</style>
