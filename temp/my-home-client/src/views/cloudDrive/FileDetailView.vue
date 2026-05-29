<template>
  <div class="file-detail">
    <div class="file-detail__header">
      <van-nav-bar title="文件详情" left-text="返回" left-arrow @click-left="onClickBack" />
    </div>

    <div class="file-detail__content">
      <div class="file-detail__info">
        <div class="file-detail__info-icon">
          <cloud-image v-if="fileInfo.type === 'file' && fileInfo.imageInfo" :file-id="fileInfo.id" />
          <img v-else :src="fileIcon" alt="文件图标" />
        </div>
        <div class="file-detail__info-content">
          <div class="file-detail__info-name">{{ fileInfo.name }}</div>
          <div class="file-detail__info-size">{{ formatFileSize(fileInfo.size) }}</div>
          <div class="file-detail__info-time">
            更新时间：{{ moment(fileInfo.updatedAt).format("YYYY-MM-DD HH:mm:ss") }}
          </div>
        </div>
      </div>

      <div class="file-detail__actions">
        <van-button type="primary" block @click="onClickDownload"> <van-icon name="download-o" /> 下载文件 </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getFileInfo, downloadFile } from "@/api/cloudDrive";
import { showLoadingToast, closeToast, showToast } from "vant";
import { getFileIcon } from "./components/fileList/utils/fileIcons";
import moment from "moment";
import { formatFileSize } from "./utils";
import type { FileInfo } from "@/api/cloudDrive/interfaces";
import CloudImage from "@/components/cloudImage/CloudImage.vue";

const route = useRoute();
const router = useRouter();

const fileId = computed(() => route.params.id as string);
const fileInfo = ref<FileInfo>({
  id: "",
  name: "",
  size: 0,
  mimeType: "",
  type: "file",
  parentId: "",
  parentPath: "",
  createdAt: "",
  updatedAt: ""
});
const isLoading = ref(false);

const fileSuffix = computed(() => fileInfo.value.name.match(/\.(.+)$/)?.[1] || "");
const fileIcon = computed(() => getFileIcon(fileSuffix.value));

/**
 * 获取文件详情
 */
const fetchFileDetail = async () => {
  if (!fileId.value) return;

  isLoading.value = true;
  try {
    const res = await getFileInfo({ id: fileId.value });
    fileInfo.value = res.data.data;
  } catch (err: any) {
    showToast(err?.message || "获取文件详情失败");
  } finally {
    isLoading.value = false;
  }
};

/**
 * 下载文件
 */
const onClickDownload = async () => {
  try {
    showLoadingToast({ message: "正在下载...", duration: 0, forbidClick: true });

    const res = await downloadFile({ id: fileId.value });
    const name = res.headers["content-disposition"];
    const fileName = decodeURIComponent(name.split("=")[1]);
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    closeToast();
    showToast("下载成功");
  } catch (err: any) {
    closeToast();
    showToast(err?.message || "下载失败");
  }
};

/**
 * 返回上一页
 */
const onClickBack = () => {
  router.back();
};

// 组件挂载时获取文件详情
onMounted(() => {
  fetchFileDetail();
});
</script>

<style lang="scss" scoped>
.file-detail {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    flex-shrink: 0;
  }

  &__content {
    padding: 20px;
    flex-grow: 1;
    background-color: #f5f5f5;
  }

  &__info {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  &__info-icon {
    margin-right: 20px;

    img {
      width: 80px;
      height: 80px;
    }
  }

  &__info-content {
    flex-grow: 1;
  }

  &__info-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  &__info-size,
  &__info-time {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }

  &__actions {
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
  }
}
</style>
