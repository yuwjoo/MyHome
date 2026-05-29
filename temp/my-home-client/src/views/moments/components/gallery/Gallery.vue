<template>
  <div class="gallery" :id="galleryId">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import PhotoSwipeLightbox from "photoswipe/lightbox";
import PhotoSwipe from "photoswipe";
import "photoswipe/style.css";
import { v1 } from "uuid";

const galleryId = `gallery-${v1()}`;

onMounted(() => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: `#${galleryId}`,
    children: "a",
    pswpModule: PhotoSwipe,
    tapAction: "close",
    secondaryZoomLevel: 2.5,
    arrowPrevSVG: "",
    arrowNextSVG: ""
  });
  lightbox.init();
});
</script>

<style lang="scss" scoped>
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
</style>
