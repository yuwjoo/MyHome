<template>
  <div class="cloud-drive-search">
    <!-- 搜索输入框 -->
    <div class="search-header">
      <van-search
        class="search-input"
        v-model="searchKey"
        placeholder="文件搜索"
        show-action
        clearable
        @search="onSearch"
        @change="onSearch"
        @action="onBack"
        action-text="取消"
      />
    </div>

    <!-- 搜索结果列表 -->
    <van-pull-refresh class="search-result" v-model="isLoading.refresh" @refresh="onRefresh">
      <van-list
        v-model:loading="isLoading.load"
        v-model:error="isError"
        :finished="isFinished"
        finished-text="没有更多了"
        error-text="加载异常，点击重试！"
        @load="onLoad"
      >
        <!-- 搜索结果为空时显示 -->
        <div v-if="searchKey && fileList.length === 0 && !isLoading.load" class="empty-result">
          <van-empty description="未找到匹配的文件" />
        </div>

        <!-- 文件列表 -->
        <FileList
          v-if="fileList.length > 0"
          :file-list="fileList"
          :list-type="listType"
          @folder-click="onFolderClick"
          @file-click="onFileClick"
        />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import FileList from "./components/fileList/FileList.vue";
import type { FileItemType } from "./components/fileList/fileList.types";
import type { ListType } from "./components/actionBar.types";
import { getFileList } from "@/api/cloudDrive";
import { showToast } from "vant";
import type { FileInfo } from "@/api/cloudDrive/interfaces";

const router = useRouter();

const searchKey = ref(""); // 搜索关键词
const fileList = ref<FileItemType[]>([]); // 文件列表
const listType = ref<ListType>("grid"); // 列表类型
const isLoading = reactive({
  refresh: false, // 刷新中
  load: false // 加载中
});
const isFinished = computed(() => pagination.current * pagination.size >= pagination.total); // 没有更多数据
const isError = ref(false); // 加载错误状态
const pagination = reactive({
  current: 0,
  size: 30,
  total: Infinity
}); // 分页数据

/**
 * 获取搜索结果
 */
const fetchSearchData = async () => {
  if (!searchKey.value.trim()) {
    fileList.value = [];
    return;
  }

  isLoading.load = true;
  try {
    const res = await getFileList({
      current: pagination.current,
      size: pagination.size,
      parentPath: "", // 空parentId表示搜索所有文件
      search: searchKey.value
    });
    const data = res.data.data;
    pagination.current = data.current;
    pagination.size = data.size;
    pagination.total = data.total;
    if (data.current === 1) {
      fileList.value = data.list as any;
    } else {
      (fileList.value as any).push(...data.list);
    }
  } catch {
    isError.value = true;
    showToast("搜索失败");
  } finally {
    isLoading.load = false;
  }
};

/**
 * 监听下拉刷新
 */
const onRefresh = async () => {
  pagination.current = 1;
  try {
    await fetchSearchData();
  } finally {
    isLoading.refresh = false;
  }
};

/**
 * 监听触底加载
 */
const onLoad = () => {
  if (isLoading.refresh) return;
  pagination.current += 1;
  fetchSearchData();
};

/**
 * 处理搜索事件
 */
const onSearch = () => {
  if (!searchKey.value.trim()) {
    fileList.value = [];
    return;
  }
  pagination.current = 1;
  fetchSearchData();
};

/**
 * 点击返回/取消按钮
 */
const onBack = () => {
  router.back();
};

/**
 * 点击文件夹
 */
const onFolderClick = (item: FileInfo) => {
  // TODO: 获取文件夹详情，更新当前路径
  router.push({ path: `/cloud-drive`, query: { path: [item.parentPath, item.name].filter(Boolean).join("/") } });
};

/**
 * 点击文件
 */
const onFileClick = (item: FileInfo) => {
  // 跳转到文件详情页
  router.push({
    name: "file-detail",
    params: { id: item.id }
  });
};
</script>

<style lang="scss" scoped>
.cloud-drive-search {
  display: flex;
  flex-direction: column;
  height: 100%;

  .search-header {
    background-color: #fff;
    border-bottom: 1px solid #ebedf0;
    padding: 10px;
  }

  .search-input {
    background-color: #f5f5f5;
  }

  .search-result {
    height: 0;
    flex-grow: 1;
  }

  .empty-result {
    padding: 50px 20px;
    text-align: center;
  }
}
</style>
