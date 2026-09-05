<script setup lang="ts">
import { useToastList } from '@/composables/toast'

/** 全局消息队列 */
const toastList = useToastList()
</script>

<template>
  <!-- 全局轻提示：悬浮于页面顶部居中，支持成功/错误/普通三类 -->
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-host" aria-live="polite">
      <div v-for="item in toastList" :key="item.id" class="toast-item" :class="`toast-item--${item.type}`">
        <span class="toast-item__dot" aria-hidden="true" />
        <span class="toast-item__text">{{ item.text }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped lang="scss">
.toast-host {
  position: fixed;
  top: calc(1rem + var(--safe-top, 0rem));
  left: 0;
  right: 0;
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0 2.5rem;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
  padding: 0.625rem 1.125rem;
  border-radius: var(--radius-full);
  background: rgba(43, 33, 27, 0.92);
  color: #fff;
  font-size: 0.875rem;
  line-height: 1.5;
  box-shadow: var(--shadow-toast);
  backdrop-filter: blur(6px);

  &__dot {
    flex: none;
    width: 0.4375rem;
    height: 0.4375rem;
    border-radius: 50%;
    background: var(--toast-dot, var(--color-ink-300));
  }

  &--success {
    --toast-dot: #6fd39a;
  }

  &--error {
    --toast-dot: #ff7a72;
  }

  &--info {
    --toast-dot: #ffb199;
  }
}

/* 弹出动画 */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
