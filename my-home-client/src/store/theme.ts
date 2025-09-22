import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

export type Theme = "dark" | "light";

/**
 * @description: 主题-store
 */
export const useThemeStore = defineStore("theme", () => {
  const theme = useStorage<Theme>("theme", "light", localStorage); // 页面主题

  return { theme };
});
