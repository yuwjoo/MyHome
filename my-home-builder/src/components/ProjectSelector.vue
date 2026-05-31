<template>
  <div class="project-selector">
    <div class="platform-tabs">
      <div
        v-for="proj in projectList"
        :key="proj.id"
        class="platform-card"
        :class="{ active: modelValue === proj.id }"
        @click="handleSelect(proj.id)"
      >
        <div class="card-icon" :style="{ color: platformColor[proj.platform] }">
          <el-icon :size="28">
            <component :is="platformIcon[proj.platform]" />
          </el-icon>
        </div>
        <div class="card-info">
          <div class="card-platform">{{ proj.platformLabel }}</div>
          <div class="card-name">{{ proj.name }}</div>
        </div>
        <div v-if="modelValue === proj.id" class="card-check">
          <el-icon :size="18" color="#409EFF"><CircleCheckFilled /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目选择器组件
 * 以平台卡片形式展示可选项目
 * 使用 unplugin-icons 编译的自定义 SVG 平台图标
 */
import { projectList, platformIcon, platformColor } from '@/config/projects';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

/** 选择项目 */
const handleSelect = (id: string) => {
  emit('update:modelValue', id);
};
</script>

<style lang="scss" scoped>
.project-selector {
  width: 100%;

  .platform-tabs {
    display: flex;
    gap: 12px;
  }

  .platform-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    background: #fff;

    &:hover {
      border-color: #c0c4cc;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    &.active {
      border-color: #409EFF;
      background: #ecf5ff;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
    }

    .card-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-info {
      .card-platform {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .card-name {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }
    }

    .card-check {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  }
}
</style>
