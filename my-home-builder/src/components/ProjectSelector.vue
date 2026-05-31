<template>
  <div class="project-selector">
    <el-form-item label="选择项目" prop="projectId">
      <el-select
        v-model="modelValue"
        placeholder="请选择要发布的项目"
        filterable
        @change="handleChange"
      >
        <el-option
          v-for="item in projectList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        >
          <span style="float: left">{{ item.name }}</span>
          <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
            {{ platformLabel[item.platform] }}
          </span>
        </el-option>
      </el-select>
    </el-form-item>

    <!-- 选中项目详情 -->
    <div v-if="selectedProject" class="project-info">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="平台">
          <el-tag :type="platformTagType(selectedProject.platform)" size="small">
            {{ platformLabel[selectedProject.platform] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="路径">
          <code>{{ selectedProject.path }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="构建命令" :span="2">
          <code>{{ selectedProject.buildCommand }}</code>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目选择器组件
 * 展示可选项目列表及选中项目详情
 */
import { computed } from 'vue';
import type { PlatformType } from '@/types/publish';
import { projectList, getProjectById, platformLabel } from '@/config/projects';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

/** 双向绑定值 */
const modelValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
});

/** 当前选中的项目配置 */
const selectedProject = computed(() => {
  if (!props.modelValue) return null;
  return getProjectById(props.modelValue) ?? null;
});

/** 平台标签类型映射 */
const platformTagType = (platform: PlatformType): string => {
  const map: Record<PlatformType, string> = {
    harmony: 'danger',
    android: 'success',
    ios: 'warning',
    web: 'info',
  };
  return map[platform] || 'info';
};

/** 选择变更回调 */
const handleChange = (val: string) => {
  emit('update:modelValue', val);
};
</script>

<style lang="scss" scoped>
.project-selector {
  width: 100%;

  .project-info {
    margin-top: 12px;

    code {
      padding: 2px 6px;
      background: #f0f2f5;
      border-radius: 4px;
      font-size: 12px;
      color: #606266;
      word-break: break-all;
    }
  }
}
</style>
