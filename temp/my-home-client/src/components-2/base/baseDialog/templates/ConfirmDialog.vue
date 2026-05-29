<template>
  <base-dialog
    v-model:show="isShow"
    :title="title"
    :before-close="beforeClose"
    show-confirm-button
    show-cancel-button
    :confirm-button-text="confirmButtonText"
    :cancel-button-text="cancelButtonText"
    :confirm-button-type="confirmButtonType"
    :cancel-button-type="cancelButtonType"
    @close="emits('close', $event)"
  >
    {{ message }}
  </base-dialog>
</template>

<script setup lang="ts">
import BaseDialog from "../BaseDialog.vue";
import { confirmDialogProps } from "../props/ConfirmDialog";
import type { ConfirmDialogEmits } from "../types/ConfirmDialog";

defineProps(confirmDialogProps);
const emits = defineEmits<ConfirmDialogEmits>();

const isShow = ref(false);

/**
 * 打开对话框
 */
const openDialog = (): void => {
  isShow.value = true;
};

/**
 * 关闭对话框
 */
const closeDialog = (): void => {
  isShow.value = false;
};

defineExpose({ openDialog, closeDialog });
</script>

<style lang="scss" scoped></style>
