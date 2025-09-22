<template>
  <van-popup class="album-action-popup-action" v-model:show="isShowAlbumActionSheet" round position="bottom">
    <van-cell
      class="album-action-popup-action__cell album-action-popup-action__rename"
      clickable
      @click="emit('action', 'rename', albumData!), closePopup()"
    >
      <div class="album-action-popup-action__cell-text">重命名</div>
    </van-cell>
    <van-cell
      class="album-action-popup-action__cell album-action-popup-action__delete"
      clickable
      @click="emit('action', 'delete', albumData!), closePopup()"
    >
      <div class="album-action-popup-action__cell-text">删除</div>
    </van-cell>
  </van-popup>
</template>

<script setup lang="ts">
import type { AlbumListItem } from "../types/albumList";

const emit = defineEmits<{
  action: [command: string, albumData: AlbumListItem];
}>();
const isShowAlbumActionSheet = ref(false); // 显示相册动作面板
const albumData = ref<AlbumListItem>(); // 相册数据

/**
 * 打开弹出层
 * @param item 相册数据
 */
const openPopup = (item: AlbumListItem) => {
  albumData.value = item;
  isShowAlbumActionSheet.value = true;
};

/**
 * 关闭弹出层
 */
const closePopup = () => {
  isShowAlbumActionSheet.value = false;
};

defineExpose({ openPopup, closePopup });
</script>

<style lang="scss" scoped>
.album-action-popup-action {
  &__cell {
    &-text {
      text-align: center;
      font-size: 16px;
      padding: 10px 0;
      color: $font-color-dd;
    }
  }

  &__delete {
    border-top: 8px solid #f7f8fa;

    .album-action-popup-action__cell-text {
      color: #ee0a24;
    }
  }
}
</style>
