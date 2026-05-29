<template>
  <base-dialog
    v-model:show="isShow"
    :title="title"
    :before-close="handleBeforeClose"
    show-confirm-button
    show-cancel-button
    :confirm-button-text="confirmButtonText"
    :cancel-button-text="cancelButtonText"
    :confirm-button-type="confirmButtonType"
    :cancel-button-type="cancelButtonType"
    @close="emits('close', $event, inputValue)"
  >
    <base-input v-model="inputValue" :placeholder="placeholder" clearable />
  </base-dialog>
</template>

<script setup lang="ts">
import BaseInput from "../../baseInput/BaseInput.vue";
import BaseDialog from "../BaseDialog.vue";
import { promptDialogProps } from "../props/PromptDialog";
import type { CloseAction } from "../types/BaseDialog";
import type { PromptDialogEmits } from "../types/PromptDialog";

const props = defineProps(promptDialogProps);
const emits = defineEmits<PromptDialogEmits>();

const isShow = ref(false);
const inputValue = ref(""); // 输入框内容

/**
 * 打开对话框
 */
const openDialog = (): void => {
  inputValue.value = "";
  isShow.value = true;
};

/**
 * 关闭对话框
 */
const closeDialog = (): void => {
  isShow.value = false;
};

/**
 * 处理关闭前置拦截
 * @param action 动作
 */
const handleBeforeClose = async (action: CloseAction) => {
  return props.beforeClose?.(action, inputValue.value);
};

defineExpose({ openDialog, closeDialog });
</script>

<style lang="scss" scoped></style>
