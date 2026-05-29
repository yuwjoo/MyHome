<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast--${toast.type}`, `toast--${toast.position}`]"
        :style="getToastPosition(toast)"
      >
        <div class="toast-content">
          <svg
            v-if="toast.type"
            class="toast-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path v-if="toast.type === 'success'" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline v-if="toast.type === 'success'" points="22 4 12 14.01 9 11.01" />
            <circle v-else-if="toast.type === 'info'" cx="12" cy="12" r="10" />
            <line v-else-if="toast.type === 'info'" x1="12" y1="16" x2="12" y2="12" />
            <line v-else-if="toast.type === 'info'" x1="12" y1="8" x2="12.01" y2="8" />
            <path
              v-else-if="toast.type === 'warning'"
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line v-else-if="toast.type === 'warning'" x1="12" y1="9" x2="12" y2="13" />
            <line v-else-if="toast.type === 'warning'" x1="12" y1="17" x2="12.01" y2="17" />
            <path
              v-else-if="toast.type === 'fail'"
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line v-else-if="toast.type === 'fail'" x1="6" y1="12" x2="18" y2="12" />
          </svg>
          <span>{{ toast.message }}</span>
        </div>
        <button v-if="toast.dismissible" class="toast-close" @click="removeToast(toast.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { v4 as uuidv4 } from "uuid";

// Toast类型定义
interface ToastOptions {
  message: string;
  type?: "success" | "info" | "warning" | "fail";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  duration?: number;
  dismissible?: boolean;
}

// 单个Toast对象
interface Toast extends ToastOptions {
  id: string;
}

// 状态管理
const toasts = ref<Toast[]>([]);

// 显示Toast
const showToast = (options: string | ToastOptions) => {
  const toastOptions = typeof options === "string" ? { message: options } : options;

  const toast: Toast = {
    id: uuidv4(),
    message: toastOptions.message,
    type: toastOptions.type || "info",
    position: toastOptions.position || "top-right",
    duration: toastOptions.duration || 3000,
    dismissible: toastOptions.dismissible !== false
  };

  toasts.value.push(toast);

  // 自动关闭
  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);
  }

  return toast.id;
};

// 移除Toast
const removeToast = (id: string) => {
  const index = toasts.value.findIndex((toast) => toast.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
};

// 清空所有Toast
const clearToasts = () => {
  toasts.value = [];
};

// 获取Toast位置样式
const getToastPosition = (toast: Toast) => {
  const position = toast.position;
  const baseStyle: Record<string, string> = {};

  if (position.includes("top")) {
    baseStyle.top = "16px";
  } else if (position.includes("bottom")) {
    baseStyle.bottom = "16px";
  }

  if (position.includes("left")) {
    baseStyle.left = "16px";
    baseStyle.transform = "translateX(0)";
  } else if (position.includes("right")) {
    baseStyle.right = "16px";
    baseStyle.transform = "translateX(0)";
  } else if (position.includes("center")) {
    baseStyle.left = "50%";
    baseStyle.transform = "translateX(-50%)";
  }

  return baseStyle;
};

// 暴露给外部使用
defineExpose({
  showToast,
  removeToast,
  clearToasts
});

// 提供给全局使用
const useToast = () => {
  return {
    showToast,
    removeToast,
    clearToasts
  };
};

// 注册全局属性
if (process.env.MODE !== "test") {
  import("vue").then(({ getCurrentInstance }) => {
    const app = getCurrentInstance()?.appContext.app;
    if (app) {
      app.provide("toast", useToast());
    }
  });
}
</script>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  pointer-events: auto;
  transition: all 0.3s ease;

  // 类型样式
  &--success {
    background-color: #dcfce7;
    color: #16a34a;
    border-left: 4px solid #16a34a;
  }

  &--info {
    background-color: #dbeafe;
    color: #2563eb;
    border-left: 4px solid #2563eb;
  }

  &--warning {
    background-color: #fef3c7;
    color: #d97706;
    border-left: 4px solid #d97706;
  }

  &--fail {
    background-color: #fee2e2;
    color: #dc2626;
    border-left: 4px solid #dc2626;
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

// 过渡动画
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
