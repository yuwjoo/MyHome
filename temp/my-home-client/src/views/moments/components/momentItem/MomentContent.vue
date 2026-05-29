<template>
  <div class="moment-content">
    <!-- 文字内容 -->
    <p class="moment-content__text" v-if="content">{{ content }}</p>

    <!-- 图片展示 -->
    <Gallery v-if="images.length" class="moment-content__gallery">
      <GalleryImage v-for="(image, index) in images" :key="index" :src="image" />
    </Gallery>

    <!-- 视频展示 -->
    <video v-if="video" :src="video" controls class="moment-content__video">您的浏览器不支持视频播放</video>
  </div>
</template>

<script setup lang="ts">
import Gallery from "../gallery/Gallery.vue";
import GalleryImage from "../gallery/GalleryImage.vue";

// Props定义
interface Props {
  content?: string;
  images?: string[];
  video?: string;
}

withDefaults(defineProps<Props>(), {
  content: "",
  images: () => [],
  video: ""
});

// Emits定义
const emit = defineEmits<{
  "image-click": [image: string, index: number];
}>();

// 处理图片点击
const handleImageClick = (image: string, index: number) => {
  emit("image-click", image, index);
};
handleImageClick;
</script>

<style lang="scss" scoped>
.moment-content {
  margin-bottom: 16px;

  &__text {
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 12px;
    white-space: pre-wrap;
    word-break: break-word;
    color: $font-color-d;
  }

  &__gallery {
    margin-bottom: 12px;
  }
}
</style>
