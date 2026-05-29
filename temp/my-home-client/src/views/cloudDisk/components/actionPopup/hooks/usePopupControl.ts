import { ref } from "vue";

/**
 * 弹出层控制-hook
 */
export const usePopupControl = () => {
  const isVisible = ref(false); // 显示状态

  /**
   * 打开
   */
  const open = (): void => {
    isVisible.value = true;
  };

  /**
   * 关闭
   */
  const close = (): void => {
    isVisible.value = false;
  };

  return {
    isVisible,
    open,
    close
  };
};
