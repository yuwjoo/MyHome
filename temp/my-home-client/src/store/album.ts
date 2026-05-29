import type { AlbumListItem, ListShowType } from "@/views/album/albumList/types/albumList";
import { useStorage } from "@vueuse/core";
import { defineStore } from "pinia";

/**
 * @description: 相册-store
 */
export const useAlbum = defineStore("album", () => {
  const albumList = useStorage<AlbumListItem[]>("albumList", [], localStorage); // 相册列表
  const albumListShowType = useStorage<ListShowType>("albumListShowType", "list", localStorage); // 相册列表展示类型

  return { albumList, albumListShowType };
});
