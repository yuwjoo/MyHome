export type ListShowType = "grid" | "list"; // grid: 宫格，list: 列表
export type AlbumListItem = {
  id: string; // id
  coverUrl: string; // 封面url
  title: string; // 相册标题
  images: string[]; // 图片集合
};
