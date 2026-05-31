<template>
  <div class="build-env-selector">
    <el-form-item label="构建环境" prop="env">
      <el-radio-group v-model="modelValue" class="env-group">
        <el-radio-button value="dev">
          <el-icon><Monitor /></el-icon>
          开发环境
        </el-radio-button>
        <el-radio-button value="test">
          <el-icon><Checked /></el-icon>
          测试环境
        </el-radio-button>
        <el-radio-button value="prod">
          <el-icon><CircleCheckFilled /></el-icon>
          生产环境
        </el-radio-button>
      </el-radio-group>
    </el-form-item>

    <!-- 环境说明 -->
    <div class="env-tips">
      <el-alert
        :title="envTips[currentEnv]?.title"
        :type="envTips[currentEnv]?.type || 'info'"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 构建环境选择器组件
 * 提供 dev / test / prod 三种环境选择，并展示环境说明
 */
import { computed } from 'vue';
import type { BuildEnv } from '@/types/publish';

const props = defineProps<{
  modelValue: BuildEnv;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: BuildEnv): void;
}>();

/** 双向绑定值 */
const modelValue = computed({
  get: () => props.modelValue,
  set: (val: BuildEnv) => emit('update:modelValue', val),
});

/** 当前环境 */
const currentEnv = computed(() => props.modelValue);

/** 环境提示信息 */
const envTips: Record<BuildEnv, { title: string; type: 'info' | 'warning' | 'error' }> = {
  dev: {
    title: '开发环境：用于日常开发调试，包含 Debug 信息',
    type: 'info',
  },
  test: {
    title: '测试环境：用于 QA 测试，接近生产配置',
    type: 'warning',
  },
  prod: {
    title: '生产环境：正式发布版本，请谨慎操作',
    type: 'error',
  },
};
</script>

<style lang="scss" scoped>
.build-env-selector {
  width: 100%;

  .env-group {
    width: 100%;

    :deep(.el-radio-button__inner) {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .env-tips {
    margin-top: 12px;
  }
}
</style>
