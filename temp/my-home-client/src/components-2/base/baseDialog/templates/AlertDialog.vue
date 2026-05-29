<template>
  <base-dialog
    v-model:show="isShow"
    :title="title"
    :before-close="beforeClose"
    :closable="closable"
    :show-confirm-button="showConfirmButton"
    :show-cancel-button="showCancelButton"
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
import { alertDialogProps } from "../props/AlertDialog";
import type { AlertDialogEmits } from "../types/AlertDialog";

defineProps(alertDialogProps);
const emits = defineEmits<AlertDialogEmits>();

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
