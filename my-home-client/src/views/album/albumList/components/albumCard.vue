<template>
  <div class="album-card">
    <div class="album-card-cover">
      <van-image
        class="album-card-cover__image"
        width="100%"
        height="100%"
        fit="cover"
        :src="coverUrl"
        block
        lazy-load
      />
    </div>
    <div class="album-card-footer">
      <div class="album-card-footer__title">{{ title }}</div>
      <div class="album-card-footer__count">-{{ imageCount }}张-</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  // 封面图Url
  coverUrl: {
    type: String,
    required: false
  },
  // 标题
  title: {
    type: String,
    required: false
  },
  // 图片集合
  images: {
    type: Array,
    default: () => []
  }
});

const imageCount = computed(() => props.images.length); // 图片总数
</script>

<style lang="scss" scoped>
.album-card-cover {
  border-radius: 10px;
  overflow: hidden;
  box-sizing: border-box;
  padding-bottom: 110%;
  position: relative;

  &__image {
    position: absolute;
  }
}

.album-card-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;

  &__title {
    color: $font-color-d;
    word-break: break-all;
  }

  &__count {
    font-size: 12px;
    color: $font-color;
    flex-shrink: 0;
  }
}
</style>
