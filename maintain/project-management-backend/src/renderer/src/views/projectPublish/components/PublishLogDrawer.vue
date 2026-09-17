<!--
  @file 发布日志抽屉组件
  @description 展示单个项目或全部项目的发布日志流，支持清空当前展示的日志
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { IPublishLogItem } from '../types/publish'
import { stageMeta } from '../utils/stage'

defineOptions({ name: 'publishLogDrawer' })

/**
 * 组件属性
 */
const props = defineProps<{
  /** 是否展示抽屉 */
  modelValue: boolean
  /** 抽屉标题 */
  title: string
  /** 当前展示的日志列表 */
  logs: IPublishLogItem[]
  /** 是否展示日志所属项目（汇总日志时需要） */
  showProject?: boolean
}>()

/**
 * 组件事件
 */
const emit = defineEmits<{
  /** 更新抽屉展示状态 */
  (event: 'update:modelValue', value: boolean): void
  /** 清空当前展示的日志 */
  (event: 'clear'): void
}>()

// 日志滚动容器
const listRef = ref<HTMLElement>()
// 抽屉展示状态：受父组件 v-model 控制
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

/**
 * 格式化日志时间
 * @param time 日志时间戳（毫秒）
 * @returns 时分秒文本，如 14:03:27
 */
function formatTime(time: number): string {
  return new Date(time).toLocaleTimeString('zh-CN', { hour12: false })
}

/**
 * 日志新增后滚到底部，贴合终端日志的阅读习惯
 */
watch(
  () => [props.logs.length, props.modelValue] as const,
  async () => {
    if (!props.modelValue) return
    await nextTick()
    const list = listRef.value
    if (list) list.scrollTop = list.scrollHeight
  }
)
</script>

<template>
  <el-drawer v-model="visible" :title="title" size="580px">
    <div ref="listRef" class="log-drawer">
      <el-empty v-if="!logs.length" description="暂无发布日志" :image-size="100" />
      <template v-else>
        <div v-for="log in logs" :key="log.id" class="log-drawer__item">
          <span class="log-drawer__time">{{ formatTime(log.time) }}</span>
          <el-tag class="log-drawer__stage" size="small" :type="stageMeta[log.stage].type">
            {{ stageMeta[log.stage].label }}
          </el-tag>
          <span v-if="showProject" class="log-drawer__project">
            {{ log.projectType }}/{{ log.projectName }}
          </span>
          <span class="log-drawer__message">{{ log.message }}</span>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button type="danger" plain :disabled="!logs.length" @click="emit('clear')">
        清空日志
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.log-drawer {
  height: 100%;
  overflow: auto;
  padding: 12px;
  border-radius: 6px;
  background: #1e1e1e;

  &__item {
    display: flex;
    align-items: flex-start;
    padding: 3px 0;
    gap: 8px;
    color: #d4d4d4;
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.8;
  }

  &__time {
    flex-shrink: 0;
    color: #6a9955;
  }

  &__stage {
    flex-shrink: 0;
  }

  &__project {
    flex-shrink: 0;
    color: #dcdcaa;
  }

  &__message {
    flex: 1;
    word-break: break-all;
  }
}
</style>
