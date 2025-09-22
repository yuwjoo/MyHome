import type { AlbumListItem } from "./albumList";

export type DialogTyep = "add" | "edit"; // 对话框类型 add: 新建，edit: 编辑
export type AlbumDataForm = Pick<AlbumListItem, "title"> & Partial<Omit<AlbumListItem, "title">>;
