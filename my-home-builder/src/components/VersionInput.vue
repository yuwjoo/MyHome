<template>
  <div class="version-input">
    <div class="version-parts">
      <div class="version-part">
        <label class="part-label">大版本号</label>
        <el-input-number
          v-model="major"
          :min="0"
          :max="99"
          :step="1"
          controls-position="right"
          size="default"
          @change="emitChange"
        />
      </div>
      <span class="version-separator">.</span>
      <div class="version-part">
        <label class="part-label">迭代版本号</label>
        <el-input-number
          v-model="minor"
          :min="0"
          :max="99"
          :step="1"
          controls-position="right"
          size="default"
          @change="emitChange"
        />
      </div>
      <span class="version-separator">.</span>
      <div class="version-part">
        <label class="part-label">Bug 版本号</label>
        <el-input-number
          v-model="patch"
          :min="0"
          :max="99"
          :step="1"
          controls-position="right"
          size="default"
          @change="emitChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 三段式版本号输入组件
 * 支持大版本号、迭代版本号、Bug版本号独立修改
 */
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const major = ref(0);
const minor = ref(0);
const patch = ref(0);

/** 解析版本号字符串到三段数字 */
const parseVersion = (version: string) => {
  const parts = version.split('.').map(Number);
  major.value = !isNaN(parts[0]) ? parts[0] : 0;
  minor.value = !isNaN(parts[1]) ? parts[1] : 0;
  patch.value = !isNaN(parts[2]) ? parts[2] : 0;
};

/** 组合三段版本号为字符串 */
const emitChange = () => {
  emit('update:modelValue', `${major.value}.${minor.value}.${patch.value}`);
};

// 监听外部版本号变化
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      parseVersion(val);
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.version-input {
  width: 100%;

  .version-parts {
    display: flex;
    align-items: flex-end;
    gap: 0;
  }

  .version-part {
    flex: 1;

    .part-label {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    :deep(.el-input-number) {
      width: 100%;
    }
  }

  .version-separator {
    font-size: 24px;
    font-weight: 600;
    color: #606266;
    padding: 0 8px;
    line-height: 32px;
  }
}
</style>
