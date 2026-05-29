<template>
  <van-dialog
    class="base-dialog"
    v-model:show="isShow"
    :show-confirm-button="false"
    :before-close="() => beforeCloseDialog('close')"
    :close-on-click-overlay="closeOnClickOverlay"
  >
    <template #title>
      <div class="base-dialog__header">
        <div class="base-dialog__header-title">
          <slot name="title">{{ title }}</slot>
        </div>
        <van-icon v-if="closable" class="base-dialog__header-clear" name="cross" @click="beforeCloseDialog('close')" />
      </div>
    </template>

    <div class="base-dialog__content">
      <slot />
    </div>

    <template v-if="slots.footer || showCancelButton || showConfirmButton" #footer>
      <div class="base-dialog__footer">
        <slot name="footer">
          <base-button
            v-if="showCancelButton"
            :type="cancelButtonType"
            :loading="cancelLoading"
            @click="onClickCancel()"
          >
            {{ cancelButtonText }}
          </base-button>
          <base-button
            v-if="showConfirmButton"
            :type="confirmButtonType"
            :loading="confirmLoading"
            @click="onClickConfirm()"
          >
            {{ confirmButtonText }}
          </base-button>
        </slot>
      </div>
    </template>
  </van-dialog>
</template>

<script setup lang="ts">
import BaseButton from "../baseButton/BaseButton.vue";
import { baseDialogModels, baseDialogProps } from "./props/BaseDialog";
import type { BaseDialogEmits, BaseDialogSlots, CloseAction } from "./types/BaseDialog";

const slots = defineSlots<BaseDialogSlots>();
const props = defineProps(baseDialogProps);
const emits = defineEmits<BaseDialogEmits>();

const isShow = defineModel("show", baseDialogModels.show);
const cancelLoading = ref(false); // 取消按钮加载中
const confirmLoading = ref(false); // 确认按钮加载中

watch(isShow, (val) => {
  if (val) init();
});

/**
 * 初始化
 */
const init = () => {
  cancelLoading.value = false;
  confirmLoading.value = false;
};

/**
 * 关闭对话框前置拦截
 * @param action 动作
 * @return 是否允许关闭
 */
const beforeCloseDialog = async (action: CloseAction): Promise<boolean> => {
  let isPass = false;
  try {
    isPass = (await props.beforeClose?.(action)) ?? true;
  } catch {
    isPass = false;
  } finally {
    if (isPass) closeDialog(action);
  }

  return isPass;
};

/**
 * 关闭对话框
 * @param action 动作
 */
const closeDialog = (action: CloseAction): void => {
  isShow.value = false;
  emits("close", action);
};

/**
 * 监听点击取消按钮
 */
const onClickCancel = async () => {
  cancelLoading.value = true;
  try {
    await beforeCloseDialog("cancel");
  } finally {
    cancelLoading.value = false;
  }
};

/**
 * 监听点击确认按钮
 */
const onClickConfirm = async () => {
  confirmLoading.value = true;
  try {
    await beforeCloseDialog("confirm");
  } finally {
    confirmLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.base-dialog {
  .base-dialog__header {
    padding: 0 var(--mh-spacing-lg) var(--mh-spacing-lg);

    .base-dialog__header-title {
      color: var(--mh-title-text-color-md);
      font-size: var(--mh-title-text-size-md);
      font-weight: var(--mh-title-font-weight-md);
    }

    .base-dialog__header-clear {
      position: absolute;
      top: var(--mh-spacing-lg);
      right: var(--mh-spacing-lg);
      font-size: 22px;
    }
  }

  .base-dialog__content {
    padding: var(--mh-spacing-lg);
    text-align: center;
  }

  .base-dialog__footer {
    padding: var(--mh-spacing-lg);
    display: flex;
    gap: var(--mh-spacing-sm);
  }
}
</style>
