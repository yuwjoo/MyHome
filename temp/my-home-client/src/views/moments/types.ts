// 定义评论类型
export interface Comment {
  id: string;
  content: string;
  createTime: string;
  username: string;
  avatar: string;
}

// 定义说说类型
export interface Moment {
  id: string;
  username: string;
  avatar: string;
  content: string;
  createTime: string;
  images?: string[];
  video?: string;
  likes?: number;
  liked?: boolean;
  commentCount?: number;
  comments?: Comment[];
}

// 说说操作类型
export interface MomentAction {
  type: "like" | "comment" | "share";
  count?: number;
  text: string;
  icon: string;
}

// 说说列表响应类型
export interface MomentListResponse {
  moments: Moment[];
  total: number;
  hasMore: boolean;
}
