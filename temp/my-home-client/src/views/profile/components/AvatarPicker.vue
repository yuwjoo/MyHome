<!-- 
  * @FileName: AvatarPicker.vue
 * @FilePath: \my-home-client\src\views\profile\components\AvatarPicker.vue
  * @Author: YH
  * @Date: 2025-12-20 19:20:00
 * @LastEditors: YH
 * @LastEditTime: 2025-12-20 21:28:06
  * @Description: 头像选择器组件
 -->

<template>
  <van-action-sheet v-model:show="visible" :actions="avatarActions" @select="handleAvatarAction" cancel-text="取消" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { ActionSheetAction } from "vant";

// 定义组件属性
const props = defineProps<{
  // 控制组件显示/隐藏
  modelValue: boolean;
}>();

// 定义组件事件
const emit = defineEmits<{
  // 更新显示状态
  (e: "update:modelValue", value: boolean): void;
  // 选择头像成功
  (e: "avatar-selected", url: string): void;
}>();

// 头像选择器可见状态
const visible = ref(false);

// 监听外部显示状态变化
watch(
  () => props.modelValue,
  (newValue) => {
    visible.value = newValue;
  }
);

// 监听内部显示状态变化
watch(visible, (newValue) => {
  emit("update:modelValue", newValue);
});

// 头像操作选项
const avatarActions = ref<ActionSheetAction[]>([
  {
    name: "拍照",
    callback: () => handleTakePhoto()
  },
  {
    name: "从相册选择",
    callback: () => handleSelectFromGallery()
  }
]);

// 处理头像操作选择
const handleAvatarAction = (action: ActionSheetAction) => {
  // 这个回调是多余的，因为我们在 actions 中已经定义了回调
  console.log(action);
};

// 拍照功能
const handleTakePhoto = async () => {
  try {
    // 在实际应用中，这里会调用摄像头 API
    // 目前使用模拟数据
    const mockAvatarUrl = "https://img.icons8.com/color/200/camera--v1.png";
    emit("avatar-selected", mockAvatarUrl);
    visible.value = false;
  } catch (error) {
    console.error("拍照失败:", error);
    visible.value = false;
  }
};

// 从相册选择
const handleSelectFromGallery = async () => {
  try {
    // 在实际应用中，这里会打开文件选择器
    // 目前使用模拟数据
    const mockAvatarUrl = "https://img.icons8.com/color/200/gallery.png";
    emit("avatar-selected", mockAvatarUrl);
    visible.value = false;
  } catch (error) {
    console.error("选择图片失败:", error);
    visible.value = false;
  }
};
</script>
