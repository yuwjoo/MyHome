<template>
  <van-popup class="move-folder-picker" v-model:show="innerShow" round position="bottom" :style="{ height: '80%' }">
    <div class="move-folder-picker__header">
      <div class="move-folder-picker__title">选择目标文件夹</div>
      <div class="move-folder-picker__path">当前位置：{{ displayPath }}</div>
      <van-button class="move-folder-picker__back" size="small" type="primary" plain :disabled="isRoot" @click="goUp">
        上一级
      </van-button>
    </div>

    <van-cell icon="location-o" clickable :title="`移动到当前文件夹 (${displayPath})`" @click="confirmCurrent" />

    <van-empty v-if="!loading && folders.length === 0" description="无子文件夹" />

    <van-list :loading="loading" :finished="true" finished-text="没有更多了">
      <van-cell
        v-for="folder in folders"
        :key="folder.id"
        is-link
        :title="folder.name"
        :clickable="folder.id !== excludeId"
        :class="{ 'move-folder-picker__cell--disabled': folder.id === excludeId }"
        @click="folder.id !== excludeId && enterFolder(folder)"
      />
    </van-list>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { getFileList } from "@/api/cloudDrive";
import type { FileInfo } from "@/api/cloudDrive/interfaces";

const props = defineProps<{
  show: boolean;
  initialPath: string;
  excludeId?: string;
}>();

const emit = defineEmits<{
  (e: "update:show", val: boolean): void;
  (e: "confirm", payload: { parentId: string; parentPath: string }): void;
}>();

const innerShow = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val)
});

const loading = ref(false);
const currentPath = ref<string>(props.initialPath || "");
const currentDirId = ref<string>("");
const folders = ref<FileInfo[]>([]);

const displayPath = computed(() => currentPath.value || "/");
const isRoot = computed(() => !currentPath.value);

const fetchFolders = async (path: string) => {
  loading.value = true;
  try {
    const res = await getFileList({
      current: 1,
      size: 200,
      parentPath: path
    });
    const data = res.data.data;
    currentDirId.value = data.dirId || "";
    currentPath.value = path;
    folders.value = (data.list as FileInfo[]).filter((item) => item.type === "directory");
  } finally {
    loading.value = false;
  }
};

const goUp = () => {
  if (isRoot.value) return;
  const segments = currentPath.value.split("/").filter(Boolean);
  segments.pop();
  const parentPath = segments.join("/");
  fetchFolders(parentPath);
};

const enterFolder = (folder: FileInfo) => {
  const path = [folder.parentPath, folder.name].filter(Boolean).join("/");
  fetchFolders(path);
};

const confirmCurrent = () => {
  emit("confirm", { parentId: currentDirId.value, parentPath: currentPath.value });
  emit("update:show", false);
};

watch(
  () => props.show,
  (val) => {
    if (val) {
      fetchFolders(props.initialPath || "");
    }
  }
);
</script>

<style lang="scss" scoped>
.move-folder-picker {
  padding: 12px 12px 0;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #323233;
  }

  &__path {
    font-size: 13px;
    color: #666;
  }

  &__back {
    align-self: flex-start;
  }

  &__cell--disabled {
    color: #c8c9cc;

    .van-cell__right-icon {
      display: none;
    }
  }
}
</style>
