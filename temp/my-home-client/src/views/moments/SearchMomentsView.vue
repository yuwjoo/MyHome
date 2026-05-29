<template>
  <div class="search-moments-view">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-header__content">
        <i-tabler:chevron-left class="search-header__back-btn" @click="handleBack" />
        <div class="search-header__input-wrapper">
          <i-tabler:search class="search-header__search-icon" />
          <input
            v-model="searchKeyword"
            type="text"
            class="search-header__input"
            placeholder="搜索"
            @keyup.enter="handleSearch"
            ref="searchInput"
          />
          <div class="search-header__actions">
            <i-tabler:circle-x-filled
              v-if="searchKeyword.trim()"
              class="search-header__clear-btn"
              @click="clearSearch"
            />
            <div class="search-header__divider"></div>
            <div
              class="search-header__submit-btn"
              :class="{ 'search-header__submit-btn--disabled': !searchKeyword.trim() }"
              @click="handleSearch"
            >
              搜索
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results">
      <!-- 搜索历史 -->
      <div v-if="!hasSearched && searchHistory.length > 0" class="search-history">
        <div class="search-history__header">
          <span class="search-history__title">搜索历史</span>
          <i-tabler:trash class="search-history__clear-btn" @click="clearHistory" />
        </div>
        <div class="search-history__tags">
          <span
            v-for="(item, index) in searchHistory"
            :key="index"
            class="search-history__tag"
            @click="searchWithHistory(item)"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <!-- 搜索结果列表 -->
      <div v-if="hasSearched" class="search-results__list">
        <div v-if="searchResults.length === 0 && !isLoading" class="search-results__empty">
          <i-tabler:search class="search-results__empty-icon" />
          <p class="search-results__empty-text">暂无相关动态</p>
        </div>
        <MomentItem
          v-for="moment in searchResults"
          :key="moment.id"
          :moment="moment"
          @like="handleLike"
          @comment="handleComment"
          @share="handleShare"
        />
      </div>

      <!-- 加载更多 -->
      <div class="loading-more" v-if="!finished && hasSearched">
        <van-loading type="spinner" v-if="isLoading" />
        <div v-else class="load-more-text" @click="loadSearchResults">点击加载更多</div>
      </div>

      <!-- 已加载全部 -->
      <div class="loaded-all" v-if="finished && hasSearched && searchResults.length > 0">已显示全部结果</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import MomentItem from "./components/momentItem/MomentItem.vue";
import type { Moment } from "./types";
import type { LikePostParams, GetAllPostsResponse } from "@/api/posts/types";
import { toggleLikePost, getAllPosts } from "@/api/posts";
import { getOssLinkSignUrl } from "@/utils/oss";
import { showToast } from "vant";

const router = useRouter();
const searchInput = ref<HTMLInputElement>();
const searchKeyword = ref("");
const hasSearched = ref(false);
const searchResults = ref<Moment[]>([]);
const searchHistory = ref<string[]>([]);
// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const isLoading = ref(false);
const finished = ref(false);

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
    likes: post.likeCount,
    liked: post.liked, // 是否本人点赞
    commentCount: post.commentCount || 0, // API提供的评论数
    comments
  };
};

// 生命周期钩子
onMounted(() => {
  // 自动聚焦搜索框
  nextTick(() => {
    searchInput.value?.focus();
  });

  // 从本地存储加载搜索历史
  const savedHistory = localStorage.getItem("momentsSearchHistory");
  if (savedHistory) {
    searchHistory.value = JSON.parse(savedHistory);
  }
});

// 返回上一页
const handleBack = () => {
  router.back();
};

// 清除搜索内容
const clearSearch = () => {
  searchKeyword.value = "";
  hasSearched.value = false;
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// 加载搜索结果
const loadSearchResults = async () => {
  if (finished.value) return;

  try {
    isLoading.value = true;

    const posts = await getAllPosts({
      current: currentPage.value,
      size: pageSize.value,
      search: searchKeyword.value.trim()
    });

    const newMoments = await Promise.all(posts.data.data.list.map(convertPostToMoment));

    // 追加到结果列表
    searchResults.value = [...searchResults.value, ...newMoments];

    // 更新总条数
    total.value = posts.data.data.total;

    // 计算是否已经加载完所有数据
    finished.value = searchResults.value.length >= total.value;

    // 如果没有加载完，准备加载下一页
    if (!finished.value) {
      currentPage.value++;
    }
  } catch (error) {
    console.error("搜索说说失败:", error);
    showToast({
      message: "搜索失败，请稍后重试",
      type: "fail"
    });
  } finally {
    isLoading.value = false;
  }
};

// 执行搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return;

  hasSearched.value = true;
  // 重置分页状态
  currentPage.value = 1;
  searchResults.value = [];
  finished.value = false;

  // 调用API加载搜索结果
  loadSearchResults();

  // 保存到搜索历史
  saveToHistory(searchKeyword.value.trim());
};

// 从历史记录中搜索
const searchWithHistory = (keyword: string) => {
  searchKeyword.value = keyword;
  handleSearch();
};

// 保存到搜索历史
const saveToHistory = (keyword: string) => {
  // 移除重复项
  const index = searchHistory.value.indexOf(keyword);
  if (index > -1) {
    searchHistory.value.splice(index, 1);
  }

  // 添加到开头
  searchHistory.value.unshift(keyword);

  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10);
  }

  // 保存到本地存储
  localStorage.setItem("momentsSearchHistory", JSON.stringify(searchHistory.value));
};

// 清空搜索历史
const clearHistory = () => {
  searchHistory.value = [];
  localStorage.removeItem("momentsSearchHistory");
};

// 处理点赞
const handleLike = async (momentId: string) => {
  try {
    // 准备点赞参数
    const likeParams: LikePostParams = {
      id: parseInt(momentId)
    };

    // 执行点赞操作
    const updatedPost = await toggleLikePost(likeParams);

    // 更新本地数据
    const momentIndex = searchResults.value.findIndex((m) => m.id === momentId);
    if (momentIndex !== -1) {
      searchResults.value[momentIndex].likes = updatedPost.data.data.likeCount;
      searchResults.value[momentIndex].liked = updatedPost.data.data.liked;
    }
  } catch (error) {
    console.error("点赞操作失败:", error);
    showToast({
      message: "点赞失败，请稍后重试",
      type: "fail"
    });
  }
};

// 处理评论
const handleComment = (momentId: string) => {
  // 导航到评论页面或显示评论弹窗
  console.log("Comment on moment:", momentId);
};

// 处理分享
const handleShare = (momentId: string) => {
  // 显示分享选项
  console.log("Share moment:", momentId);
};
</script>

<style lang="scss" scoped>
$bg-color: #f5f5f5;

.search-moments-view {
  min-height: 100vh;
  background-color: $bg-color;
}

// 搜索头部样式
.search-header {
  height: 50px;
  margin-bottom: 12px;

  &__content {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    box-sizing: border-box;
    background-color: white;
    z-index: 10;
  }

  &__back-btn {
    font-size: 24px;
    color: $font-color-d;
    margin-right: 12px;
  }

  &__input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background-color: $bg-color;
    border-radius: 16px;
    padding: 0 12px;
    height: 70%;
  }

  &__search-icon {
    font-size: 16px;
    color: $font-color-d;
    margin-right: 8px;
  }

  &__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: $font-color-d;
  }

  &__actions {
    display: flex;
    align-items: center;
  }

  &__clear-btn {
    font-size: 14px;
    color: $font-color-d;
    cursor: pointer;
  }

  &__divider {
    width: 1px;
    height: 10px;
    background-color: $font-color-l;
    margin: 0 12px;
  }

  &__submit-btn {
    font-size: 12px;
    color: $theme-color;
    cursor: pointer;
  }

  &__submit-btn--disabled {
    opacity: 0.4;
  }
}

// 搜索结果区域样式
.search-results {
  padding: 0 16px 16px;
}

// 搜索历史样式
.search-history {
  margin-bottom: 20px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 14px;
    color: $font-color-dd;
  }

  &__clear-btn {
    font-size: 14px;
    color: $font-color-d;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__tag {
    display: inline-block;
    padding: 6px 12px;
    background-color: white;
    border-radius: 12px;
    font-size: 13px;
    color: $font-color-d;
  }
}

// 搜索结果列表样式
.search-results__list {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
}

.search-results__empty {
  padding: 40px 20px;
  text-align: center;
  color: $font-color-d;

  &-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  &-text {
    font-size: 14px;
  }
}

// 加载更多样式
.loading-more {
  text-align: center;
  padding: 20px 0;
  color: $font-color-d;
}

.load-more-text {
  font-size: 14px;
  color: $font-color-d;
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  background-color: white;
  display: inline-block;
}

.load-more-text:hover {
  background-color: $bg-color;
}

// 已加载全部样式
.loaded-all {
  text-align: center;
  padding: 16px 0;
  font-size: 12px;
  color: $font-color-l;
  background-color: white;
  margin-top: 1px;
}
</style>
