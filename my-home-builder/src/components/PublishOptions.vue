<template>
  <div class="publish-options">
    <el-form-item label="发布描述">
      <el-input
        v-model="modelDescription"
        type="textarea"
        :rows="3"
        placeholder="请输入本次发布的描述信息（可选）"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>

    <el-form-item label="自动发布">
      <el-switch
        v-model="modelAutoPublish"
        active-text="构建完成后自动发布"
        inactive-text="仅构建，不自动发布"
        size="large"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
/**
 * 发布选项组件
 * 提供发布描述输入和自动发布开关
 */
import { computed } from 'vue';

const props = defineProps<{
  description: string;
  autoPublish: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:description', value: string): void;
  (e: 'update:autoPublish', value: boolean): void;
}>();

/** 双向绑定：描述 */
const modelDescription = computed({
  get: () => props.description,
  set: (val: string) => emit('update:description', val),
});

/** 双向绑定：自动发布 */
const modelAutoPublish = computed({
  get: () => props.autoPublish,
  set: (val: boolean) => emit('update:autoPublish', val),
});
</script>

<style lang="scss" scoped>
.publish-options {
  width: 100%;
}
</style>
