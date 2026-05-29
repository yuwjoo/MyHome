<template>
  <div class="gallery-image">
    <a
      :href="src"
      :data-pswp-width="naturalWidth"
      :data-pswp-height="naturalHeight"
      data-cropped="true"
      target="_blank"
    >
      <van-image width="100%" height="100%" fit="cover" :lazy-load="lazyLoad" :src="src" @load="onLoad" />
    </a>
  </div>
</template>

<script lang="ts" setup>
import type { Props } from "./types/galleryImage";

withDefaults(defineProps<Props>(), {
  lazyLoad: true
});

const naturalWidth = ref(0); // 图片原始宽度
const naturalHeight = ref(0); // 图片原始高度

/**
 * 监听图片加载事件
 * @param ev 事件对象
 */
const onLoad = (ev: Event) => {
  const target = ev.target as HTMLImageElement;
  naturalWidth.value = target.naturalWidth;
  naturalHeight.value = target.naturalHeight;
};
</script>

<style lang="scss" scoped>
.gallery-image {
  width: 100px;
  height: 100px;
  box-shadow: 1px 1px 3px 0 $border-color;
  border-radius: 3px;
  overflow: hidden;
}
</style>
