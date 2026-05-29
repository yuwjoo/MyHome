<template>
  <div class="moments-container">
    <!-- 头部 -->
    <MomentsHeader />

    <!-- 说说列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh" success-text="刷新成功">
      <van-list
        v-model:loading="isLoading"
        v-model:error="isError"
        error-text="加载失败，点击重试！"
        :finished="finished"
        :finished-text="'没有更多了'"
        :immediate-check="false"
        @load="onLoad"
      >
        <MomentItem
          v-for="moment in moments"
          :key="moment.id"
          class="moments-container__item"
          :moment="moment"
          @image-click="handleImageClick"
          @action="handleMomentAction"
        />
      </van-list>
    </van-pull-refresh>

    <!-- 悬浮添加按钮 -->
    <AddMomentButton @click="goPublish" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { Moment } from "./types";
import type { LikePostParams, GetAllPostsResponse } from "@/api/posts/types";
import MomentItem from "./components/momentItem/MomentItem.vue";
import AddMomentButton from "./components/AddMomentButton.vue";
import MomentsHeader from "./components/MomentsHeader.vue";
import { toggleLikePost, getAllPosts } from "@/api/posts";
import { getOssLinkSignUrl } from "@/utils/oss";

// 响应式数据
const moments = ref<Moment[]>([]);
const router = useRouter();
const isLoading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const isError = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 转换Post为Moment类型
const convertPostToMoment = async (post: GetAllPostsResponse): Promise<Moment> => {
  const mediaUrls = await Promise.all(
    post.mediaUrls.map(async (url) => (await getOssLinkSignUrl({ ossLink: url })) || url)
  );

  // 转换comments为本地Comment类型
  const comments = post.comments.map((comment) => ({
    id: comment.id.toString(),
    content: comment.content,
    createTime: comment.createdAt,
    username: comment.user.nickname || comment.user.username,
    avatar: comment.user.avatar || ""
  }));

  return {
    id: post.id.toString(),
    username: post.user.username, // 实际项目中应该从用户信息中获取
    avatar: post.user.avatar || "", // 实际项目中应该从用户信息中获取
    content: post.content,
    createTime: post.createdAt,
    images: mediaUrls,
    // images: mediaUrls.filter((url) => url.match(/\.(jpg|jpeg|png|gif|webp)$/i)),
    // video: mediaUrls.find((url) => url.match(/\.(mp4|avi|mov|wmv)$/i)),
    likes: post.likeCount,
    liked: post.liked, // 是否本人点赞
    commentCount: post.commentCount || 0, // API提供的评论数
    comments
  };
};

// 跳转到发表页面
const goPublish = () => {
  router.push("/publish-moment");
};

// 处理图片点击
const handleImageClick = (image: string, index: number) => {
  console.log("Image clicked:", image, "at index:", index);
  // 实际项目中可以打开图片预览
};

// 处理说说操作
const handleMomentAction = async (type: "like" | "comment" | "share", momentId: string) => {
  switch (type) {
    case "like": {
      try {
        // 准备点赞参数
        const likeParams: LikePostParams = {
          id: parseInt(momentId)
        };

        // 执行点赞操作
        const updatedPost = await toggleLikePost(likeParams);

        // 更新本地数据
        const momentIndex = moments.value.findIndex((m) => m.id === momentId);
        if (momentIndex !== -1) {
          moments.value[momentIndex].likes = updatedPost.data.data.likeCount;
          moments.value[momentIndex].liked = updatedPost.data.data.liked;
        }
      } catch (error) {
        console.error("点赞操作失败:", error);
      }
      break;
    }
    case "comment":
      console.log("Comment on moment:", momentId);
      // 实际项目中可以打开评论框或跳转到评论页面
      break;
    case "share":
      console.log("Share moment:", momentId);
      // 实际项目中可以打开分享面板
      break;
  }
};

// 加载数据
const loadMoments = async (isRefresh = false) => {
  try {
    // 如果是刷新，重置当前页和已加载状态
    if (isRefresh) {
      currentPage.value = 1;
      finished.value = false;
    }

    const posts = await getAllPosts({
      current: currentPage.value,
      size: pageSize.value
    });

    const newMoments = await Promise.all(posts.data.data.list.map(convertPostToMoment));

    // 如果是刷新，直接替换列表
    // 如果是加载更多，追加到列表
    if (isRefresh) {
      moments.value = newMoments;
    } else {
      moments.value = [...moments.value, ...newMoments];
    }

    // 更新总条数
    total.value = posts.data.data.total;

    // 计算是否已经加载完所有数据
    finished.value = moments.value.length >= total.value;

    // 如果没有加载完，准备加载下一页
    if (!finished.value) {
      currentPage.value++;
    }
  } catch (error) {
    console.error("加载说说失败:", error);
    isError.value = true;
  } finally {
    isLoading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefresh = async () => {
  await loadMoments(true);
};

// 上拉加载
const onLoad = async () => {
  if (refreshing.value) return;
  await loadMoments(false);
};

loadMoments();
</script>

<style lang="scss" scoped>
.moments-container {
  box-sizing: border-box;
  min-height: 100%;
  background-color: #f5f5f5;

  &__item {
    &:not(:first-child) {
      margin-top: 16px;
    }
  }
}
</style>
