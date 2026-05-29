<template>
  <div class="cloud-drive">
    <!-- 顶部导航header -->
    <NavHeader class="cloud-drive__header" :dir-path="currentFolderPath" @back="onBack" />

    <div class="cloud-drive__list">
      <van-pull-refresh v-model="isLoading.refresh" @refresh="onRefresh">
        <van-list
          v-model:loading="isLoading.load"
          v-model:error="isError"
          :finished="isFinished"
          finished-text="没有更多了"
          error-text="加载异常，点击重试！"
          @load="onLoad"
        >
          <!-- 模糊搜索输入框 -->
          <SearchInput />

          <!-- 动作栏 -->
          <!-- <ActionBar v-model:list-type="listType" /> -->

          <!-- 文件列表 -->
          <FileList
            :file-list="fileList"
            :list-type="listType"
            @folder-click="onFolderClick"
            @file-click="onFileClick"
            @long-press="onLongPress"
          />
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 添加按钮 -->
    <AddButton @click="onClickAdd" />

    <!-- 隐藏的文件选择器 -->
    <input ref="fileInputRef" type="file" style="display: none" @change="onFileSelected" />

    <!-- 添加动作弹层：创建文件夹/上传文件 -->
    <AddActionPopup
      v-model:show="isShowAddPopup"
      @create-folder="onChooseCreateFolder"
      @upload-file="onChooseUploadFile"
    />

    <!-- 创建文件夹弹层 -->
    <CreateFolderPopup v-model:show="isShowCreateFolderPopup" @confirm="onConfirmCreateFolder" />

    <!-- 文件操作弹层 -->
    <FileActionPopup
      v-model:show="isShowActionPopup"
      :file="selectedFile"
      @rename="openRenameDialog"
      @delete="onDeleteFile"
      @move="openMoveDialog"
    />

    <!-- 重命名弹窗 -->
    <van-dialog v-model:show="isShowRenameDialog" show-cancel-button title="重命名" @confirm="onConfirmRename">
      <van-field v-model="renameInput" label="名称" placeholder="请输入新名称" />
    </van-dialog>

    <!-- 移动目录选择器 -->
    <MoveFolderPicker
      v-model:show="isShowMovePicker"
      :initial-path="movePickerPath"
      :exclude-id="selectedFile?.id"
      @confirm="onConfirmMove"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import NavHeader from "./components/NavHeader.vue";
import FileList from "./components/fileList/FileList.vue";
import FileActionPopup from "./components/fileList/FileActionPopup.vue";
import MoveFolderPicker from "./components/fileList/MoveFolderPicker.vue";
import type { FileItemType } from "./components/fileList/fileList.types";
import SearchInput from "./components/SearchInput.vue";
// import ActionBar from "./components/ActionBar.vue";
import AddButton from "./components/AddButton.vue";
import AddActionPopup from "./components/AddActionPopup.vue";
import CreateFolderPopup from "./components/CreateFolderPopup.vue";
import { getFileList, tryInstantUpload, createFile, renameFile, deleteFile, moveFile } from "@/api/cloudDrive";
import type { ListType } from "./components/actionBar.types";
import type { TryInstantUploadResponse } from "@/api/cloudDrive/types";
import { showLoadingToast, closeToast, showToast, showConfirmDialog } from "vant";
import type { FileInfo, UploadUrlInfo } from "@/api/cloudDrive/interfaces";
import { uploadFile } from "@/api/cloudDrive";

const router = useRouter();
const route = useRoute();

// 从路由query中获取初始路径
const initialPath = (route.query.path as string) || "";
const currentFolderPath = ref<string>(initialPath); // 当前所在文件夹路径
const currentFolderId = ref(""); // 当前所在文件夹ID

// 监听路径变化，更新路由query
watch(
  () => currentFolderPath.value,
  (newPath) => {
    router.replace({
      query: {
        ...route.query,
        path: newPath || undefined
      }
    });
  }
);

// 组件挂载时加载初始路径的文件列表
onMounted(() => {
  pagination.current = 1;
  fetchListData();
});

// 监听路由query中的path变化
watch(
  () => route.query.path,
  (newPath) => {
    const path = (newPath as string) || "";
    if (path !== currentFolderPath.value) {
      currentFolderPath.value = path;
      currentFolderId.value = "";
      pagination.current = 1;
      fetchListData();
    }
  }
);

const listType = ref<ListType>("grid"); // 列表类型
const fileList = ref<FileItemType[]>([]); // 文件列表
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

// 添加动作弹层显隐
const isShowAddPopup = ref(false);
// 创建文件夹弹层显隐
const isShowCreateFolderPopup = ref(false);
// 文件选择器引用
const fileInputRef = ref<HTMLInputElement | null>(null);
// 文件操作相关
const selectedFile = ref<FileInfo | null>(null);
const isShowActionPopup = ref(false);
const isShowRenameDialog = ref(false);
const renameInput = ref("");
const isShowMovePicker = ref(false);
const movePickerPath = ref("");

/**
 * 获取列表数据
 */
const fetchListData = async () => {
  isLoading.load = true;
  try {
    const res = await getFileList({
      current: pagination.current,
      size: pagination.size,
      parentPath: currentFolderPath.value
    });
    const data = res.data.data;
    pagination.current = data.current;
    pagination.size = data.size;
    pagination.total = data.total;
    currentFolderId.value = data.dirId;
    if (data.current === 1) {
      fileList.value = data.list as any;
    } else {
      (fileList.value as any).push(...data.list);
    }
  } catch {
    isError.value = true;
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
    await fetchListData();
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
  fetchListData();
};

/**
 * 点击添加按钮
 */
const onClickAdd = () => {
  isShowAddPopup.value = true;
};

/**
 * 选择创建文件夹
 */
const onChooseCreateFolder = () => {
  isShowAddPopup.value = false;
  isShowCreateFolderPopup.value = true;
};

/**
 * 选择上传文件
 */
const onChooseUploadFile = () => {
  isShowAddPopup.value = false;
  fileInputRef.value?.click();
};

/**
 * 计算文件hash (SHA-256)
 */
const calcFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(digest));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
};

/**
 * 处理文件选择/上传
 */
const onFileSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  // 清空选择
  input.value = "";
  if (!file) return;
  try {
    showLoadingToast({ message: "正在上传...", duration: 0, forbidClick: true });
    const hash = await calcFileHash(file);
    // 尝试秒传
    const resp = await tryInstantUpload({
      hash,
      size: file.size,
      name: file.name,
      mimeType: file.type || "application/octet-stream"
    });
    const data = resp.data.data as TryInstantUploadResponse;
    let ossFileId = (data as any).ossFileId as string | undefined;

    if (!ossFileId) {
      const uploadInfo = data as UploadUrlInfo;
      const resp = await uploadFile({
        url: uploadInfo.uploadUrl,
        headers: uploadInfo.extraHeaders,
        file
      });
      ossFileId = resp.data.data;
    }

    // 创建云盘文件
    await createFile({
      name: file.name,
      type: "file",
      ossFileId: ossFileId!,
      parentId: currentFolderId.value
    });

    closeToast();
    showToast("上传成功");
    // 刷新列表
    pagination.current = 1;
    await fetchListData();
  } catch (err: any) {
    closeToast();
    showToast(err?.message || "上传失败");
  }
};

/**
 * 点击文件夹
 */
const onFolderClick = (item: FileInfo) => {
  currentFolderId.value = item.id;
  currentFolderPath.value = [item.parentPath, item.name].filter(Boolean).join("/");
  pagination.current = 1;
  fetchListData();
};

/**
 * 点击后退
 */
const onBack = () => {
  // 解析当前路径
  const pathSegments = currentFolderPath.value.split("/").filter(Boolean);
  // 如果没有路径，则已经在根目录，不需要后退
  if (pathSegments.length === 0) return;

  // 移除最后一个路径段，得到上一级路径
  pathSegments.pop();
  const parentPath = pathSegments.join("/");

  // 更新当前路径和文件夹ID
  currentFolderPath.value = parentPath;
  currentFolderId.value = "";
  pagination.current = 1;
  fetchListData();
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

/**
 * 长按文件/文件夹
 */
const onLongPress = (item: FileInfo) => {
  selectedFile.value = item;
  renameInput.value = item.name;
  isShowActionPopup.value = true;
};

/**
 * 打开重命名弹窗
 */
const openRenameDialog = () => {
  if (!selectedFile.value) return;
  isShowRenameDialog.value = true;
};

/**
 * 确认重命名
 */
const onConfirmRename = async () => {
  if (!selectedFile.value) return;
  if (!renameInput.value.trim()) {
    showToast("请输入新名称");
    return;
  }
  try {
    showLoadingToast({ message: "正在重命名...", duration: 0, forbidClick: true });
    await renameFile({ id: selectedFile.value.id, name: renameInput.value.trim() });
    closeToast();
    showToast("重命名成功");
    pagination.current = 1;
    await fetchListData();
  } catch (err: any) {
    closeToast();
    showToast(err?.message || "重命名失败");
  }
};

/**
 * 删除文件/文件夹
 */
const onDeleteFile = async () => {
  if (!selectedFile.value) return;
  try {
    await showConfirmDialog({
      title: "确认删除",
      message: `确定删除“${selectedFile.value.name}”吗？`
    });
  } catch {
    return;
  }
  try {
    showLoadingToast({ message: "正在删除...", duration: 0, forbidClick: true });
    await deleteFile({ id: selectedFile.value.id });
    closeToast();
    showToast("删除成功");
    pagination.current = 1;
    await fetchListData();
  } catch (err: any) {
    closeToast();
    showToast(err?.message || "删除失败");
  }
};

/**
 * 打开移动弹窗
 */
const openMoveDialog = () => {
  if (!selectedFile.value) return;
  movePickerPath.value = currentFolderPath.value;
  isShowMovePicker.value = true;
};

/**
 * 确认移动
 */
const onConfirmMove = async (target: { parentId: string; parentPath: string }) => {
  if (!selectedFile.value) return;

  // 防止移动到自身或子目录
  if (selectedFile.value.type === "directory") {
    const selfPath = [selectedFile.value.parentPath, selectedFile.value.name].filter(Boolean).join("/");
    if (target.parentPath === selfPath || target.parentPath.startsWith(`${selfPath}/`)) {
      showToast("不能移动到自身或子目录");
      return;
    }
  }

  try {
    showLoadingToast({ message: "正在移动...", duration: 0, forbidClick: true });
    await moveFile({ id: selectedFile.value.id, parentId: target.parentId });
    closeToast();
    showToast("移动成功");
    pagination.current = 1;
    await fetchListData();
  } catch (err: any) {
    closeToast();
    showToast(err?.message || "移动失败");
  }
};

/**
 * 创建文件夹确认
 */
const onConfirmCreateFolder = async (folderName: string) => {
  isShowCreateFolderPopup.value = false;
  try {
    if (!folderName || !folderName.trim()) {
      showToast("请输入文件夹名称");
      return;
    }
    showLoadingToast({ message: "正在创建...", duration: 0, forbidClick: true });
    await createFile({
      name: folderName.trim(),
      type: "directory",
      // 目录不需要 ossFileId
      ossFileId: undefined,
      parentId: currentFolderId.value // 当前目录
    } as any);
    closeToast();
    showToast("创建成功");
    pagination.current = 1;
    await fetchListData();
  } catch (err: any) {
    closeToast();
    showToast(err?.message || "创建失败");
  }
};
</script>

<style lang="scss" scoped>
.cloud-drive {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    flex-shrink: 0;
  }
}
</style>
