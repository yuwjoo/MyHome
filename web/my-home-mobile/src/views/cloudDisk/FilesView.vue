<template>
  <div
    data-cmp="FilesView"
    ref="containerRef"
    class="relative min-h-screen bg-transparent flex flex-col max-w-md mx-auto overflow-x-hidden"
    :class="scrollDisabled ? 'overflow-y-hidden' : 'overflow-y-auto'"
    @touchstart.passive="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    :style="pullStyle"
  >
    <!-- ==================== 下拉刷新指示器 ==================== -->
    <PullRefreshIndicator
      :pulling="pulling"
      :refreshing="refreshing"
      :pull-distance="pullDistance"
      :threshold="threshold"
    />

    <!-- ==================== 全局弹窗层 ==================== -->
    <DeleteDialog
      :visible="deleteDialog.visible"
      :label="deleteDialog.label"
      :path="deleteDialog.path"
      :paths="deleteDialog.paths"
      @confirm="onDeleteConfirmed"
      @cancel="closeDeleteDialog"
    />

    <RenameDialog
      :visible="renameDialog.visible"
      :initial-name="renameDialog.initialName"
      :path="renameDialog.path"
      @confirm="onRenameConfirmed"
      @cancel="closeRenameDialog"
    />

    <!-- ==================== 多选状态头部 ==================== -->
    <SelectionHeader
      :visible="isSelecting"
      :selected-count="selectedIds.size"
      :total-count="files.length"
      :all-selected="allSelected"
      @cancel="cancelSelection"
      @select-all="selectAll"
      @deselect-all="deselectAll"
    />

    <!-- ==================== 顶部操作栏 ==================== -->
    <header class="px-5 pt-10 pb-4 bg-transparent flex items-center justify-between gap-2">
      <button
        @click="router.push('/search')"
        class="flex items-center gap-2 h-10 px-3.5 rounded-2xl bg-card border border-border shadow-custom active:border-primary/40 transition-colors"
        style="width: 47%; min-width: 0"
      >
        <SearchIcon :size="14" class="text-muted-foreground flex-shrink-0" :stroke-width="2.5" />
        <span class="text-sm text-muted-foreground truncate">搜索文件...</span>
      </button>

      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="relative">
          <button
            @click="router.push('/transfer')"
            class="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom active:bg-muted transition-colors"
          >
            <ArrowRightLeftIcon :size="16" class="text-foreground" :stroke-width="2" />
          </button>
          <span
            v-if="downloadCount > 0"
            class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none shadow-sm"
          >
            {{ downloadCount > 99 ? '99+' : downloadCount }}
          </span>
        </div>
        <button
          @click="addSheetOpen = true"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-primary active:bg-primary/80 transition-colors shadow-custom"
        >
          <PlusIcon :size="20" class="text-primary-foreground" :stroke-width="2.5" />
        </button>
      </div>
    </header>

    <!-- ==================== 存储空间卡片（仅根目录显示） ==================== -->
    <div class="px-4 mb-3" :class="{ hidden: !isAtRoot }">
      <StorageCard :used-gb="STORAGE_USED_GB" :total-gb="STORAGE_TOTAL_GB" :percent="STORAGE_PCT" />
    </div>

    <!-- ==================== 吸顶区域：面包屑 + 筛选 & 布局切换 ==================== -->
    <div class="sticky top-0 z-20 bg-background">
      <div :class="{ hidden: isAtRoot }">
        <BreadcrumbNav :items="pathStack" @navigate="handleNavigateBreadcrumb" />
      </div>

      <div class="flex items-center justify-between px-4 py-2">
        <button
          @click="categoryOpen = true"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all text-xs font-semibold shadow-custom tab-active-pill"
          :class="typeFilter === 'all' ? 'text-primary' : TAB_COLORS[typeFilter].active"
        >
          <component :is="currentTab.Icon" :size="13" :stroke-width="2.2" />
          <span>{{ currentTab.label }}</span>
          <ChevronDownIcon :size="12" :stroke-width="2.5" class="ml-0.5 opacity-70" />
        </button>

        <div
          class="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-custom"
        >
          <button
            @click="layout = 'list'"
            class="flex items-center justify-center w-8 h-6 rounded-lg transition-all"
            :class="
              layout === 'list'
                ? 'bg-primary text-primary-foreground shadow-custom'
                : 'text-muted-foreground'
            "
          >
            <LayoutListIcon :size="13" :stroke-width="2" />
          </button>
          <button
            @click="layout = 'grid'"
            class="flex items-center justify-center w-8 h-6 rounded-lg transition-all"
            :class="
              layout === 'grid'
                ? 'bg-primary text-primary-foreground shadow-custom'
                : 'text-muted-foreground'
            "
          >
            <LayoutGridIcon :size="13" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 分类选择弹窗 ==================== -->
    <CategoryPicker
      :visible="categoryOpen"
      :active-filter="typeFilter"
      @select="setFilter"
      @close="categoryOpen = false"
    />

    <!-- ==================== 文件列表区域 ==================== -->
    <div class="flex-1" :class="isSelecting ? 'pb-44' : 'pb-32'">
      <FileList
        :files="files"
        :layout="layout"
        :selected-ids="selectedIds"
        @toggle-select="toggleSelect"
        @open-folder="openFolder"
        @open-file="openFile"
        @file-action="handleFileActionShown"
      />
    </div>

    <!-- ==================== 新建操作面板 ==================== -->
    <AddSheet :visible="addSheetOpen" :parent-path="currentPath" @close="addSheetOpen = false" @created="refreshFileList" />

    <!-- ==================== 文件操作面板 ==================== -->
    <FileActionSheet
      :visible="fileActionTarget !== null"
      :file="fileActionTarget"
      @close="closeFileAction"
      @delete="handleSingleDelete"
      @rename="handleSingleRename"
      @info="handleSingleInfo"
      @move="handleSingleMove"
      @download="handleSingleDownload"
    />

    <!-- ==================== 多选操作底部栏 ==================== -->
    <SelectionFooter
      :visible="isSelecting"
      :selected-count="selectedIds.size"
      @delete="handleBulkDelete"
      @rename="handleBulkRename"
      @info="handleBulkInfo"
      @move="handleBulkMove"
      @download="handleBulkDownload"
    />
  </div>
</template>

<script setup lang="ts">
// ============================================================
// 1. 导入依赖
// ============================================================
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayoutListIcon,
  LayoutGridIcon,
  PlusIcon,
  ArrowRightLeftIcon,
  ChevronDownIcon,
  SearchIcon,
} from 'lucide-vue-next'
import type { FileItem, LayoutMode } from '@/types'
import { fetchFileList, notifyRefreshSuccess } from './data'

// ── 组合式函数 ──
import { useFileNavigation } from './composables/useFileNavigation'
import { useSelection } from './composables/useSelection'
import { useFileActions } from './composables/useFileActions'
import { useTypeFilter, TAB_COLORS } from './composables/useTypeFilter'
import { useDialogs } from './composables/useDialogs'
import { useFileHandlers } from './composables/useFileHandlers'
import { usePullRefresh } from '@/composables/usePullRefresh'

// ── 子组件 ──
import BreadcrumbNav from './components/BreadcrumbNav.vue'
import FileList from './components/FileList.vue'
import AddSheet from './components/AddSheet.vue'
import SelectionHeader from './components/SelectionHeader.vue'
import SelectionFooter from './components/SelectionFooter.vue'
import FileActionSheet from './components/FileActionSheet.vue'
import DeleteDialog from './components/DeleteDialog.vue'
import RenameDialog from './components/RenameDialog.vue'
import StorageCard from './components/StorageCard.vue'
import CategoryPicker from './components/CategoryPicker.vue'
import PullRefreshIndicator from '@/components/PullRefreshIndicator.vue'

// ============================================================
// 2. 静态常量
// ============================================================
const STORAGE_USED_GB = 14.3
const STORAGE_TOTAL_GB = 50
const STORAGE_PCT = Math.round((STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100)

// ============================================================
// 3. 组合式函数实例化
// ============================================================
const router = useRouter()

// 文件导航
const navigation = useFileNavigation()
const { pathStack, currentPath, isAtRoot } = navigation

// 类型筛选
const { typeFilter, currentTab, resetFilter, setFilter } = useTypeFilter()

// ── 文件列表（从 API 获取） ──
const rawFiles = ref<FileItem[]>([])
const fileLoading = ref(false)

/** 加载指定路径的文件列表 */
async function loadFiles(path: string) {
  fileLoading.value = true
  try {
    rawFiles.value = await fetchFileList(path)
  } catch {
    rawFiles.value = []
  } finally {
    fileLoading.value = false
  }
}

// 当前路径变化时自动重新加载
watch(currentPath, (path) => { loadFiles(path) }, { immediate: true })

/** 供外部调用的刷新方法（下拉刷新、删除/重命名/创建后） */
async function refreshFileList() {
  await loadFiles(currentPath.value)
  notifyRefreshSuccess()
}

// 文件筛选
const files = computed<FileItem[]>(() =>
  typeFilter.value === 'all'
    ? rawFiles.value
    : rawFiles.value.filter((f) => f.type === typeFilter.value),
)

// 多选
const selection = useSelection(() => files.value)
const {
  selectedIds,
  isSelecting,
  allSelected,
  toggleSelect,
  selectAll,
  deselectAll,
  cancelSelection,
} = selection

// 文件操作
const fileActions = useFileActions()
const { fileActionTarget, downloadCount, closeFileAction } = fileActions

// 对话框状态
const dialogs = useDialogs()
const { deleteDialog, renameDialog, closeDeleteDialog, closeRenameDialog } = dialogs

// 事件处理（统一收拢所有 handler）
const {
  openFolder,
  openFile,
  handleNavigateBreadcrumb,
  handleFileActionShown,
  handleSingleDelete,
  handleSingleRename,
  handleSingleInfo,
  handleSingleMove,
  handleSingleDownload,
  handleBulkDelete,
  handleBulkRename,
  handleBulkInfo,
  handleBulkMove,
  handleBulkDownload,
  onDeleteConfirmed,
  onRenameConfirmed,
} = useFileHandlers({
  router,
  navigation,
  selection,
  fileActions,
  dialogs,
  typeFilter: { typeFilter, currentTab, resetFilter, setFilter },
  refreshFileList,
})

// 下拉刷新
const refreshDisabled = computed(() =>
  isSelecting.value ||
  addSheetOpen.value ||
  categoryOpen.value ||
  fileActionTarget.value !== null ||
  deleteDialog.value.visible ||
  renameDialog.value.visible,
)

const {
  containerRef,
  pulling,
  refreshing,
  pullDistance,
  threshold,
  scrollDisabled,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} = usePullRefresh(
  async () => {
    await loadFiles(currentPath.value)
  },
  72,
  refreshDisabled,
)

// ============================================================
// 4. 本地 UI 状态
// ============================================================
const layout = ref<LayoutMode>('list')
const addSheetOpen = ref(false)
const categoryOpen = ref(false)

// ============================================================
// 5. 计算属性
// ============================================================
/** 下拉刷新时的容器位移样式 */
const pullStyle = computed(() => ({
  transform:
    pulling.value || refreshing.value
      ? `translateY(${Math.min(pullDistance.value, threshold * 1.2)}px)`
      : undefined,
  transition: pulling.value ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.1,0.64,1)',
}))
</script>
