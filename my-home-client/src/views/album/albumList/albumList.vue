<template>
  <div class="album-list">
    <div class="album-list-header album-list__header">
      <search-box class="album-list-header__search" v-model="searchKeyText" />
      <div class="album-list-header__add album-list__header-add" @click="albumEditDialogRef?.openDialog('add')">
        <i-tabler-plus />
      </div>
    </div>

    <div class="album-list-item-panel album-list__item-panel">
      <div class="album-list-item-panel__header">
        <div class="album-list-item-panel__header-title">相册分类</div>
        <div class="album-list-item-panel__header-toggle" @click="toggleListShowType">
          <i-tabler-layout-list v-if="albumListShowType === 'grid'" />
          <i-tabler-layout-grid v-else-if="albumListShowType === 'list'" />
        </div>
      </div>

      <div class="album-list-item-panel__content">
        <div
          class="album-list-list"
          :class="{
            'album-list-list--grid': albumListShowType === 'grid',
            'album-list-list--list': albumListShowType === 'list',
            'album-list-list--empty': filterAlbumList.length === 0
          }"
          ref="albumListRef"
        >
          <div
            class="album-list-list__item"
            v-for="(item, index) in filterAlbumList"
            :key="index"
            v-on-long-press.prevent="() => handleItemLongPress(item)"
            @click="handleItemClick(item)"
          >
            <album-card :cover-url="item.coverUrl" :title="item.title" :images="item.images" />
          </div>
          <van-empty
            v-if="filterAlbumList.length === 0"
            class="album-list-list__empty"
            image="error"
            description="没有相册呢~"
          />
        </div>
      </div>
    </div>

    <album-edit-dialog ref="albumEditDialogRef" @add="handleAddAlbum" @edit="handleEditAlbum" />

    <album-action-popup ref="albumActionPopupRef" @action="handleAlbumAction" />

    <album-delete-dialog ref="albumDeleteDialogRef" @delete="handleDeleteAlbum" />
  </div>
</template>

<script setup lang="ts">
import searchBox from "./components/searchBox.vue";
import albumCard from "./components/albumCard.vue";
import albumEditDialog from "./components/albumEditDialog.vue";
import albumActionPopup from "./components/albumActionPopup.vue";
import albumDeleteDialog from "./components/albumDeleteDialog.vue";
import type { AlbumListItem } from "./types/albumList";
import { vOnLongPress } from "@vueuse/components";
import type { AlbumDataForm } from "./types/albumEditDialog";
import { useAlbum } from "@/store/album";
import { storeToRefs } from "pinia";
import { useRouter } from "@/router";

const router = useRouter();
const { albumList, albumListShowType } = storeToRefs(useAlbum());

const searchKeyText = ref(""); // 模糊搜索关键字
const albumEditDialogRef = useTemplateRef("albumEditDialogRef"); // 编辑相册对话框
const albumActionPopupRef = useTemplateRef("albumActionPopupRef"); // 相册动作弹出层
const albumDeleteDialogRef = useTemplateRef("albumDeleteDialogRef"); // 删除相册对话框
const filterAlbumList = computed(() => {
  return albumList.value.filter((item) => item.title.includes(searchKeyText.value));
}); // 过滤后的相册列表

const albumListRef = useTemplateRef("albumListRef"); // 相册列表DOM
let albumListScrollTop = 0; // 相册列表滚动的top值
onActivated(() => {
  albumListRef.value?.scroll({ left: 0, top: albumListScrollTop });
  console.log(albumListScrollTop);
});
onDeactivated(() => {
  albumListScrollTop = albumListRef.value?.scrollTop ?? 0;
  console.log(albumListScrollTop, albumListRef.value);
});

/**
 * 设置相册列表
 */
const setAlbumList = () => {
  albumList.value = [
    {
      id: "1",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg1",
      title: "呀呀呀",
      images: []
    },
    {
      id: "2",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg1",
      title: "山东积分迫使对方数据的批发价我二姐佛欧文金额佛文件而佛为偶分",
      images: []
    },
    {
      id: "3",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
      title: "呀呀呀",
      images: []
    },
    {
      id: "4",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
      title: "呀呀呀",
      images: []
    },
    {
      id: "5",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
      title: "呀呀呀",
      images: []
    },
    {
      id: "6",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
      title: "呀呀呀",
      images: []
    },
    {
      id: "7",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
      title: "呀呀呀",
      images: []
    },
    {
      id: "8",
      coverUrl: "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg",
      title: "呀呀呀",
      images: []
    }
  ];
};

/**
 * 切换列表展示类型
 */
const toggleListShowType = () => {
  albumListShowType.value = albumListShowType.value === "grid" ? "list" : "grid";
};

/**
 * 处理添加相册
 * @param albumData 相册数据
 */
const handleAddAlbum = (albumData: AlbumDataForm) => {
  console.log("添加", albumData);
};

/**
 * 处理编辑相册
 * @param albumData 相册数据
 */
const handleEditAlbum = (albumData: AlbumDataForm) => {
  console.log("编辑", albumData);
};

/**
 * 处理删除相册
 * @param albumData 相册数据
 */
const handleDeleteAlbum = (albumData: AlbumListItem) => {
  console.log("删除", albumData);
};

/**
 * 处理长按列表项
 * @param itme 相册数据
 */
const handleItemLongPress = (item: AlbumListItem) => {
  console.log(item);
  albumActionPopupRef.value?.openPopup(item);
};

/**
 * 处理相册动作
 * @param command 指令名称
 * @param albumData 相册数据
 */
const handleAlbumAction = (command: string, albumData: AlbumListItem) => {
  switch (command) {
    case "rename":
      albumEditDialogRef.value?.openDialog("edit", albumData);
      break;
    case "delete":
      albumDeleteDialogRef.value?.openDialog(albumData);
      break;
  }
};

/**
 * 处理点击相册项
 * @param item 相册数据
 */
const handleItemClick = (item: AlbumListItem) => {
  router.push({ name: "albumDetail", params: { id: item.id } });
};

setAlbumList();
</script>

<style lang="scss" scoped>
.album-list {
  height: 100%;
  box-sizing: border-box;
  padding: 20px;
  background: linear-gradient(45deg, rgba($theme-color, 0.08) 55%, rgba(219, 56, 100, 0.1));
  display: flex;
  flex-direction: column;

  &__header {
    flex-shrink: 0;
    margin-bottom: 40px;

    &-add {
      margin-left: 10px;
    }
  }

  &__item-panel {
    height: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;

    .album-list-item-panel__header {
      flex-shrink: 0;
    }

    .album-list-item-panel__content {
      height: 0;
      flex-grow: 1;
    }
  }
}

.album-list-header {
  display: flex;

  &__search {
    flex-grow: 1;
  }

  &__add {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid $font-color-dd;
    border-radius: 16px;
    background-color: transparent;
    font-size: 30px;
    color: $font-color-dd;
    padding: 0 10px;
  }
}

.album-list-item-panel {
  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    &-title {
      color: $font-color-dd;
      font-size: 18px;
      display: flex;
      align-items: center;

      &::before {
        content: "";
        display: block;
        width: 5px;
        height: 100%;
        background: $theme-color;
        border-radius: 5px;
        margin-right: 5px;
      }
    }

    &-toggle {
      font-size: 20px;
    }
  }
}

.album-list-list {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;

  &--grid {
    .album-list-list__item {
      width: calc(100% / 2 - 10px);
    }
  }

  &--list {
    .album-list-list__item {
      width: 100%;
    }
  }

  &--empty {
    justify-content: center;
  }

  &__item {
    margin-bottom: 30px;
  }
}
</style>
