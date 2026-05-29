import type { Moment, MomentListResponse } from "./types";

// 模拟moments数据
export const mockMoments: Moment[] = [
  {
    id: "1",
    username: "张三",
    avatar: "https://picsum.photos/id/1027/100/100",
    content: "今天天气真好，适合出去走走！",
    createTime: new Date(Date.now() - 3600000).toISOString(),
    images: ["https://picsum.photos/id/15/400/300", "https://picsum.photos/id/16/400/300"],
    likes: 23,
    commentCount: 5,
    comments: []
  },
  {
    id: "2",
    username: "李四",
    avatar: "https://picsum.photos/id/1027/100/100",
    content: "分享一个美食视频，看起来很美味！",
    createTime: new Date(Date.now() - 7200000).toISOString(),
    video: "https://example.com/video.mp4",
    likes: 45,
    commentCount: 12,
    comments: []
  },
  {
    id: "1",
    username: "张三",
    avatar: "https://picsum.photos/id/1027/100/100",
    content: "今天天气真好，适合出去走走！",
    createTime: new Date(Date.now() - 3600000).toISOString(),
    images: ["https://picsum.photos/id/15/400/300"],
    likes: 23,
    commentCount: 5,
    comments: []
  },
  {
    id: "3",
    username: "王五",
    avatar: "https://picsum.photos/id/1027/100/100",
    content: "今天完成了一个重要的项目，感到很充实！",
    createTime: new Date(Date.now() - 10800000).toISOString(),
    likes: 67,
    commentCount: 8,
    comments: []
  }
];

// 模拟获取moments列表的异步函数
export const fetchMoments = async (page = 1, pageSize = 10): Promise<MomentListResponse> => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const moments = mockMoments.slice(start, end);

  return {
    moments,
    total: mockMoments.length,
    hasMore: end < mockMoments.length
  };
};

// 模拟点赞操作
export const likeMoment = async (momentId: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const moment = mockMoments.find((m) => m.id === momentId);
  if (moment) {
    moment.likes = (moment.likes || 0) + 1;
  }
  return true;
};

// 模拟评论操作
export const commentMoment = async (momentId: string, content: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const moment = mockMoments.find((m) => m.id === momentId);
  if (moment) {
    moment.commentCount = (moment.commentCount || 0) + 1;
    if (!moment.comments) {
      moment.comments = [];
    }
    moment.comments.push({
      id: Date.now().toString(),
      content,
      createTime: new Date().toISOString(),
      username: "当前用户",
      avatar: "https://picsum.photos/id/1027/100/100"
    });
  }
  return true;
};

// 模拟获取单条moment详情
export const fetchMomentDetail = async (momentId: string): Promise<Moment | null> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockMoments.find((m) => m.id === momentId) || null;
};
