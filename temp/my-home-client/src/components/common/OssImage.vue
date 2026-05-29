<template>
  <van-image
    :src="processedUrl"
    :width="width"
    :height="height"
    :fit="fit"
    :round="round"
    :radius="radius"
    :lazy-load="lazyLoad"
    :show-error="showError"
    :show-loading="showLoading"
    :error-icon="errorIcon"
    :loading-icon="loadingIcon"
    @click="$emit('click')"
    @load="$emit('load')"
    @error="$emit('error')"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Image as VanImage } from "vant";
import { getOssLinkSignUrl } from "@/utils/oss";
import { parseOssLink } from "@/utils/oss";

// 定义组件属性
interface Props {
  // 图片URL（支持普通URL和OSS链接）
  src: string;
  // 图片宽度
  width?: number | string;
  // 图片高度
  height?: number | string;
  // 图片填充模式
  fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  // 是否显示为圆形
  round?: boolean;
  // 圆角大小，支持数字、字符串百分比
  radius?: number | string;
  // 是否开启懒加载
  lazyLoad?: boolean;
  // 是否显示错误提示
  showError?: boolean;
  // 是否显示加载提示
  showLoading?: boolean;
  // 自定义错误图标
  errorIcon?: string | any;
  // 自定义加载图标
  loadingIcon?: string | any;
}

const props = withDefaults(defineProps<Props>(), {
  width: undefined,
  height: undefined,
  fit: "fill",
  round: false,
  radius: undefined,
  lazyLoad: false,
  showError: true,
  showLoading: true,
  errorIcon: undefined,
  loadingIcon: undefined
});

// 定义事件
defineEmits<{
  (e: "click"): void;
  (e: "load"): void;
  (e: "error"): void;
}>();

// 处理后的图片URL
const processedUrl = ref<string>(props.src);

// 判断是否为OSS链接
const isOssLink = (url: string): boolean => {
  return parseOssLink(url) !== null;
};

// 获取处理后的URL
const getProcessedUrl = async (url: string): Promise<string> => {
  // 如果是OSS链接，则获取签名URL
  if (isOssLink(url)) {
    try {
      return await getOssLinkSignUrl({ ossLink: url });
    } catch (error) {
      console.error("获取OSS签名URL失败:", error);
      return url; // 获取失败时返回原始URL
    }
  }
  // 否则返回原始URL
  return url;
};

// 监听src属性变化
watch(
  () => props.src,
  async (newSrc) => {
    processedUrl.value = await getProcessedUrl(newSrc);
  },
  { immediate: true }
);
</script>

<style scoped>
/* 可以根据需要添加自定义样式 */
</style>
