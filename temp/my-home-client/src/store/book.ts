import { crawlers } from "@/utils/crawler";
import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

/**
 * @description: 小说-store
 */
export const useBook = defineStore("book", () => {
  const list = [crawlers.lengku8.meta, crawlers.tbxsw.meta]; // 小说平台列表
  const current = useStorage("bookPlatformCurrent", list[0].name, localStorage); // 当前小说平台
  const bookPlatform = reactive({ list, current });

  const settings = useStorage(
    "bookReadSettings",
    {
      isNight: false, // 是否暗色模式
      customBg: "#f6f6f6", // 自定义背景颜色
      fontSizeScale: 0 // 字体缩放比例
    },
    localStorage
  );

  const mode = computed(() => {
    return {
      night: {
        bg: "#1b1b1b",
        color: "#6e6e6e",
        fontSizeScale: settings.value.fontSizeScale
      },
      light: {
        bg: settings.value.customBg,
        color: "#101010",
        fontSizeScale: settings.value.fontSizeScale
      }
    };
  }); // 模式属性

  const currentMode = computed(() => (settings.value.isNight ? mode.value.night : mode.value.light)); // 当前模式

  // 设置小说阅读页设置
  const setSetting = (key: string, value: any) => {
    settings.value[key] = value;
  };

  return { bookPlatform, settings, mode, currentMode, setSetting };
});
