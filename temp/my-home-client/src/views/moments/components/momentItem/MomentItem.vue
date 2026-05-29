<template>
  <div class="moment-item">
    <!-- 用户信息 -->
    <MomentHeader :username="moment.username" :avatar="moment.avatar" :create-time="moment.createTime" />

    <!-- 内容区域 -->
    <MomentContent
      :content="moment.content"
      :images="moment.images"
      :video="moment.video"
      @image-click="handleImageClick"
    />

    <!-- 操作栏 -->
    <MomentActions
      :likes="moment.likes"
      :commentCount="moment.commentCount"
      :liked="moment.liked"
      @action="handleAction"
    />

    <!-- 评论输入框 -->
    <CommentInput v-if="showCommentInput" @submit="handleCommentSubmit" @cancel="handleCommentCancel" />

    <!-- 评论列表 -->
    <div v-if="displayComments && comments.length > 0" class="moment-comments">
      <div v-for="comment in comments" :key="comment.id" class="moment-comment-item">
        <div class="moment-comment-item__avatar">
          <img :src="comment.avatar" :alt="comment.username" class="moment-comment-item__avatar-img" />
        </div>
        <div class="moment-comment-item__content">
          <div class="moment-comment-item__header">
            <span class="moment-comment-item__username">{{ comment.username }}</span>
            <span class="moment-comment-item__time">{{ formatTime(comment.createTime) }}</span>
          </div>
          <p class="moment-comment-item__text">{{ comment.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from "vue";
import { showToast } from "vant";
import type { Moment, Comment } from "../../types";
import type { CreateCommentParams } from "@/api/posts/types";
import MomentHeader from "./MomentHeader.vue";
import MomentContent from "./MomentContent.vue";
import MomentActions from "./MomentActions.vue";
import CommentInput from "./CommentInput.vue";
import { createComment } from "@/api/posts";

// Props定义
interface Props {
  moment: Moment;
}

const props = defineProps<Props>();

// Emits定义
const emit = defineEmits<{
  "image-click": [image: string, index: number];
  action: [type: "like" | "comment" | "share", momentId: string];
}>();

// 状态管理
const showCommentInput = ref(false);

// 计算评论列表（合并本地评论和原始评论）
const comments = computed(() => {
  return props.moment.comments || [];
});

// 是否显示评论（有评论或正在输入时显示）
const displayComments = computed(() => {
  return comments.value.length > 0 || showCommentInput.value;
});

// 处理图片点击
const handleImageClick = (image: string, index: number) => {
  emit("image-click", image, index);
};

// 处理操作点击
const handleAction = (type: "like" | "comment" | "share") => {
  if (type === "comment") {
    showCommentInput.value = !showCommentInput.value;
  }
  emit("action", type, props.moment.id);
};

// 处理评论提交
const handleCommentSubmit = async (content: string) => {
  try {
    const momentId = parseInt(props.moment.id);
    const params: CreateCommentParams = {
      content
    };

    // 调用评论API
    const response = await createComment(momentId, params);
    const newComment = response.data.data;

    // 更新本地状态
    const moment = props.moment;
    moment.commentCount = (moment.commentCount || 0) + 1;
    if (!moment.comments) {
      moment.comments = [];
    }

    // 转换API返回的Comment类型为本地的Comment类型
    const comment: Comment = {
      id: newComment.id.toString(),
      content: newComment.content,
      createTime: newComment.createdAt,
      username: newComment.user.username,
      avatar: newComment.user.avatar || ""
    };

    moment.comments.push(comment);
    showToast("评论发布成功");
  } catch (error) {
    console.error("提交评论失败:", error);
    showToast("评论发布失败，请重试");
  }

  // 关闭评论输入框
  showCommentInput.value = false;
};

// 处理评论取消
const handleCommentCancel = () => {
  showCommentInput.value = false;
};

// 格式化时间
const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 转换为分钟
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;

  // 转换为小时
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  // 转换为天
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;

  // 显示具体日期
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};
</script>

<style lang="scss" scoped>
.moment-item {
  background-color: #fff;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.moment-comments {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.moment-comment-item {
  display: flex;
  margin-bottom: 12px;
  gap: 8px;

  &__avatar {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  &__content {
    flex: 1;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__username {
    font-size: 13px;
    font-weight: 500;
    color: #333;
  }

  &__time {
    font-size: 12px;
    color: #999;
  }

  &__text {
    font-size: 14px;
    line-height: 1.5;
    color: #333;
    margin: 0;
    word-break: break-word;
  }
}
</style>
