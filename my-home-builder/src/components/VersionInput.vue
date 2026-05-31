<template>
  <div class="version-input">
    <el-form-item label="版本号" prop="version">
      <el-input
        v-model="modelValue"
        placeholder="请输入版本号，如 1.0.0"
        :prefix-icon="Calendar"
        clearable
      >
        <template #append>
          <el-tooltip content="格式: 主版本.次版本.修订号" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
      </el-input>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
/**
 * 版本号输入组件
 * 支持语义化版本号输入及格式校验
 */
import { computed } from 'vue';
import { Calendar, QuestionFilled } from '@element-plus/icons-vue';

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
</script>

<style lang="scss" scoped>
.version-input {
  width: 100%;
}
</style>
