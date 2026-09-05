<script setup lang="ts">
/**
 * 确认弹窗
 * ------------------------------------------------------------
 * 用法：
 *   <ConfirmDialog
 *     v-model:open="show"
 *     title="删除菜谱"
 *     message="删除后不可恢复，确定继续吗？"
 *     danger
 *     confirm-text="删除"
 *     @confirm="doDelete"
 *   />
 * 点击遮罩 / 取消按钮 / Esc 均视为取消。
 */
import { onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    /** 是否危险操作（删除类），按钮变红 */
    danger?: boolean
  }>(),
  {
    title: '提示',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    danger: false,
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function cancel(): void {
  emit('update:open', false)
  emit('cancel')
}

function confirm(): void {
  emit('update:open', false)
  emit('confirm')
}

// 打开时锁定页面滚动
function lockScroll(locked: boolean): void {
  document.body.style.overflow = locked ? 'hidden' : ''
}

watch(
  () => props.open,
  (value) => lockScroll(value),
)

// Esc 关闭
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) cancel()
}
window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  lockScroll(false)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-overlay" @click.self="cancel">
        <div class="dialog" role="alertdialog" aria-modal="true" :aria-label="title">
          <h2 class="dialog__title">{{ title }}</h2>
          <p v-if="message" class="dialog__message">{{ message }}</p>
          <div class="dialog__actions">
            <button type="button" class="btn btn--soft dialog__btn" @click="cancel">
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="btn dialog__btn"
              :class="danger ? 'btn--danger-solid' : 'btn--primary'"
              @click="confirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  background: rgba(30, 20, 14, 0.45);
  backdrop-filter: blur(2px);
}

.dialog {
  width: 100%;
  max-width: 21rem;
  padding: 1.5rem 1.375rem 1.125rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-pop);

  &__title {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--color-ink-900);
    text-align: center;
  }

  &__message {
    margin: 0.625rem 0 0;
    font-size: 0.875rem;
    line-height: 1.7;
    color: var(--color-ink-500);
    text-align: center;
    word-break: break-word;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  &__btn {
    flex: 1;
    min-height: 2.75rem;
    padding: 0 0.75rem;
  }
}

/* 弹出/淡入动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog,
.dialog-leave-active .dialog {
  transition: transform 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog,
.dialog-leave-to .dialog {
  transform: scale(0.92);
}
</style>
