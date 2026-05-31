<template>
  <div class="build-progress">
    <div class="progress-header">
      <h4>构建进度</h4>
      <el-tag :type="statusTagType" size="small">
        {{ statusLabel }}
      </el-tag>
    </div>

    <el-progress
      :percentage="progressPercent"
      :status="progressStatus"
      :stroke-width="16"
      :text-inside="true"
    />

    <div v-if="task" class="progress-meta">
      <span>任务 ID: {{ task.id }}</span>
      <span v-if="task.startTime">
        耗时: {{ elapsedTime }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 构建进度组件
 * 展示构建任务的进度条、状态标签和耗时信息
 */
import { computed, ref, onUnmounted } from 'vue';
import type { BuildTask, BuildStatus } from '@/types/publish';

const props = defineProps<{
  task: BuildTask | null;
}>();

/** 耗时计时器 */
const elapsedSeconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

// 启动计时器
if (props.task?.startTime && props.task.status === 'building') {
  timer = setInterval(() => {
    if (props.task?.startTime) {
      elapsedSeconds.value = Math.floor((Date.now() - props.task.startTime) / 1000);
    }
  }, 1000);
}

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

/** 状态标签类型 */
const statusTagType = computed(() => {
  const map: Record<BuildStatus, string> = {
    idle: 'info',
    building: 'warning',
    success: 'success',
    failed: 'danger',
  };
  return props.task ? map[props.task.status] : 'info';
});

/** 状态文本 */
const statusLabel = computed(() => {
  const map: Record<BuildStatus, string> = {
    idle: '空闲',
    building: '构建中',
    success: '成功',
    failed: '失败',
  };
  return props.task ? map[props.task.status] : '空闲';
});

/** 进度百分比 */
const progressPercent = computed(() => {
  if (!props.task) return 0;
  if (props.task.status === 'success') return 100;
  if (props.task.status === 'failed') return 50;
  // 模拟进度
  return Math.min(90, props.task.logs.length * 5);
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
      font-size: 14px;
    }
  }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
