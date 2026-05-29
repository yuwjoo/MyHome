<!-- 
  * @FileName: OptionItem.vue
 * @FilePath: \my-home-client\src\views\profile\components\OptionItem.vue
  * @Author: YH
  * @Date: 2025-12-20 19:10:00
 * @LastEditors: YH
 * @LastEditTime: 2025-12-20 21:27:01
  * @Description: 可复用选项列表组件
 -->

<template>
  <div class="option-item" :class="{ 'is-last': isLast }" @click="handleClick">
    <div class="option-left">
      <span class="option-icon">{{ icon }}</span>
      <span class="option-text">{{ text }}</span>
    </div>
    <div class="option-right">
      <slot name="right">
        <span class="option-arrow">›</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

// 定义组件属性
defineProps<{
  // 选项图标
  icon: string;
  // 选项文字
  text: string;
  // 是否为最后一项（无下边框）
  isLast?: boolean;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: "click"): void;
}>();

// 处理点击事件
const handleClick = () => {
  emit("click");
};
</script>

<style scoped lang="scss">
@import "@/assets/style/variable.scss";

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid $border-color;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &.is-last {
    border-bottom: none;
  }

  &:hover {
    background-color: $background-color-m;
  }

  // 左侧部分（图标和文字）
  .option-left {
    display: flex;
    align-items: center;
  }

  // 图标样式
  .option-icon {
    font-size: 20px;
    margin-right: 16px;
  }

  // 文字样式
  .option-text {
    font-size: $font-size-medium-x;
    color: $font-color-dd;
  }

  // 右侧部分
  .option-right {
    display: flex;
    align-items: center;
  }

  // 默认箭头样式
  .option-arrow {
    font-size: 20px;
    color: $font-color-l;
  }
}
</style>
