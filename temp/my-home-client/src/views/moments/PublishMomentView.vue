<template>
  <div class="publish-moment-container">
    <!-- 页面头部 -->
    <div class="publish-header">
      <div class="cancel-btn" @click="handleCancel">取消</div>
      <div class="publish-date">{{ currentDate }}</div>
      <div class="publish-btn" :class="{ disabled: !canPublish }" @click="handlePublish">发布</div>
    </div>

    <!-- 发表内容区域 -->
    <div class="publish-content">
      <!-- 文字输入区域 -->
      <textarea
        v-model="content"
        class="content-input"
        placeholder="分享你的想法..."
        rows="5"
        maxlength="500"
      ></textarea>

      <!-- 字数统计 -->
      <div class="word-count">{{ content.length }}/500</div>

      <!-- 已选择的媒体文件预览和添加图片按钮 -->
      <div class="media-preview">
        <!-- 添加图片的占位卡片 -->
        <div class="add-media-card" @click="selectMediaType('image')">
          <i-tabler:plus class="add-media-icon" />
        </div>

        <div v-for="(file, index) in mediaFiles" :key="index" class="media-item">
          <img v-if="file.type === 'image'" :src="file.url" alt="预览" class="preview-image" />
          <video v-else-if="file.type === 'video'" :src="file.url" controls class="preview-video">
            您的浏览器不支持视频播放
          </video>
          <div class="remove-media" @click="removeMedia(index)">
            <i-tabler:x />
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      :accept="fileInputAccept"
      :multiple="selectedMediaType === 'image'"
      class="hidden-file-input"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { showToast, showLoadingToast } from "vant";
import { createPost, uploadPostsFile } from "@/api/posts";
import type { CreatePostParams } from "@/api/posts/types";

// 定义媒体文件类型
interface MediaFile {
  type: "image" | "video";
  url: string;
  file?: File;
}

// 响应式数据
const content = ref("");
const mediaFiles = ref<MediaFile[]>([]);
const selectedMediaType = ref<"image" | "video" | null>(null);
const fileInput = ref<HTMLInputElement>();
const router = useRouter();
const isUploading = ref(false);
const uploadProgress = ref(0);

// 当前日期
const currentDate = computed(() => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日`;
});

// 计算属性：是否可以发布
const canPublish = computed(() => {
  return content.value.trim().length > 0 || mediaFiles.value.length > 0;
});

// 计算属性：是否已添加视频
const hasVideo = computed(() => {
  return mediaFiles.value.some((file) => file.type === "video");
});

// 计算属性：文件输入的accept属性
const fileInputAccept = computed(() => {
  if (selectedMediaType.value === "image") {
    return "image/*";
  } else if (selectedMediaType.value === "video") {
    return "video/*";
  }
  return "image/*,video/*"; // 默认接受图片和视频
});

// 选择媒体类型
const selectMediaType = async (type: "image" | "video") => {
  // 检查视频限制：如果已有视频，则不允许再添加
  if (type === "video" && hasVideo.value) {
    alert("最多只能选择1个视频");
    return;
  }

  selectedMediaType.value = type;
  await nextTick();
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  // 处理媒体文件
  const filesToAdd = Array.from(files);
  const validFiles: MediaFile[] = [];

  // 验证文件
  for (const file of filesToAdd) {
    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
      alert("文件大小不能超过10MB");
      continue;
    }

    // 确定文件类型
    const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;

    if (!fileType) {
      alert("只支持图片和视频文件");
      continue;
    }

    // 创建文件预览URL
    const url = URL.createObjectURL(file);

    validFiles.push({
      type: fileType,
      url,
      file
    });
  }

  // 添加有效文件到列表
  if (validFiles.length > 0) {
    // 如果有视频文件，清空现有列表并只添加视频
    const hasVideoFile = validFiles.some((f) => f.type === "video");
    if (hasVideoFile) {
      // 只保留第一个视频文件
      const videoFile = validFiles.find((f) => f.type === "video");
      if (videoFile) {
        // 释放之前的blob URL
        mediaFiles.value.forEach((f) => {
          if (f.url.startsWith("blob:")) {
            URL.revokeObjectURL(f.url);
          }
        });
        mediaFiles.value = [videoFile];
      }
    } else {
      mediaFiles.value.push(...validFiles);
    }
  }

  // 清空文件输入，以便可以再次选择相同的文件
  if (target) {
    target.value = "";
  }
};

// 移除媒体文件
const removeMedia = (index: number) => {
  const removedFile = mediaFiles.value[index];
  if (removedFile.url.startsWith("blob:")) {
    URL.revokeObjectURL(removedFile.url); // 释放blob URL
  }
  mediaFiles.value.splice(index, 1);
};

// 取消发布
const handleCancel = () => {
  // 确认对话框
  if (content.value.trim() || mediaFiles.value.length > 0) {
    if (!confirm("确定要取消发布吗？已编辑的内容将会丢失。")) {
      return;
    }
  }

  // 释放所有blob URL
  mediaFiles.value.forEach((file) => {
    if (file.url.startsWith("blob:")) {
      URL.revokeObjectURL(file.url);
    }
  });

  // 返回上一页
  router.back();
};

// 上传文件到OSS
const uploadFilesToOss = async (): Promise<string[]> => {
  try {
    // 获取需要上传的文件
    const filesToUpload = mediaFiles.value.filter((file) => file.file && file.url.startsWith("blob:"));
    const uploadedUrls: string[] = [];

    // 上传每个文件
    for (let i = 0; i < filesToUpload.length; i++) {
      const fileItem = filesToUpload[i];
      if (!fileItem.file) continue;

      // 上传文件
      const result = await uploadPostsFile(fileItem.file);

      uploadedUrls.push(result);
    }

    return uploadedUrls;
  } catch (error) {
    console.error("OSS上传失败:", error);
    throw new Error("文件上传失败，请稍后重试");
  }
};

// 发布动态
const handlePublish = async () => {
  if (!canPublish.value) return;

  try {
    // 显示上传中提示
    isUploading.value = true;
    uploadProgress.value = 0;
    showLoadingToast({
      message: "发布中...",
      forbidClick: true
    });

    // 上传文件到OSS
    const uploadedUrls = await uploadFilesToOss();

    // 准备发布参数
    const postParams: CreatePostParams = {
      content: content.value.trim(),
      mediaUrls: uploadedUrls
    };

    // 调用发布API
    await createPost(postParams);

    showToast("发布成功");

    // 跳转到动态列表页
    setTimeout(() => {
      router.push("/moments");
    }, 500);
  } catch (error) {
    console.error("发布失败:", error);
    showToast({
      message: error instanceof Error ? error.message : "发布失败，请稍后重试",
      type: "fail"
    });
  } finally {
    isUploading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.publish-moment-container {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding-bottom: 16px; /* 添加底部内边距 */
}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
}

.cancel-btn {
  color: #666;
  font-size: 16px;
  cursor: pointer;
}

.publish-date {
  font-size: 15px;
  color: #333;
}

.publish-btn {
  color: #1989fa;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.publish-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  padding-bottom: 24px; /* 增加底部内边距，避免内容被遮挡 */
}

.content-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 8px;
  /* 优化输入框样式 */
  min-height: 120px;
  padding: 8px 0;
}

.word-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-bottom: 16px;
  /* 确保字数统计在滚动时也可见 */
  position: sticky;
  top: 0;
  background-color: #fff;
  padding-top: 4px;
}

.media-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5; /* 添加背景色，避免加载时闪烁 */
}

.preview-image,
.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-media {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-media-card {
  aspect-ratio: 1;
  border: 1px dashed #ddd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f8f8;

  &:hover {
    background-color: #f0f0f0;
    border-color: #1989fa;
  }
}

.add-media-icon {
  font-size: 38px;
  color: #999;
  margin-bottom: 4px;

  .add-media-card:hover & {
    color: #1989fa;
  }
}

.add-media-text {
  font-size: 12px;
  color: #999;

  .add-media-card:hover & {
    color: #1989fa;
  }
}

.hidden-file-input {
  display: none;
}

/* 适配滚动条样式 */
.publish-content::-webkit-scrollbar {
  width: 4px;
}

.publish-content::-webkit-scrollbar-track {
  background: transparent;
}

.publish-content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.publish-content::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style>
