<template>
  <div class="action-bar">
    <div class="action-bar-sort" @click="isShowSortPopup = true">
      <span class="action-bar-sort__label">{{ sortModeName }}</span>
      <i-tabler:chevron-down class="action-bar-sort__icon" />
    </div>
    <div class="action-bar-action">
      <i-tabler:filter-search
        class="action-bar-action__filter"
        :class="{ 'action-bar-action__filter--active': isShowFilterList }"
        @click="isShowFilterList = !isShowFilterList"
      />
      <div class="action-bar-action__list-type" @click="onClickListType">
        <i-tabler:list v-if="listType === 'grid'" class="action-bar-action__list-type-icon" />
        <i-tabler:layout-grid v-else class="action-bar-action__list-type-icon" />
      </div>
    </div>
  </div>
  <div v-if="isShowFilterList" class="action-bar-filter-list">
    <div
      v-for="item in filterModeList"
      :key="item.value"
      class="action-bar-filter-list__item"
      :class="{
        'action-bar-filter-list__item--active': filterMode === item.value
      }"
      @click="onClickFilterItem(item)"
    >
      {{ item.label }}
    </div>
  </div>

  <!-- 排序选项弹出层 -->
  <van-popup
    class="action-bar-sort-popup"
    v-model:show="isShowSortPopup"
    round
    position="bottom"
    closeable
    teleport="body"
  >
    <div class="action-bar-sort-popup__title">排序</div>
    <div class="action-bar-sort-popup__options">
      <div
        v-for="item in sortModeList"
        :key="item.value"
        class="action-bar-sort-popup__options-item"
        :class="{ 'action-bar-sort-popup__options-item--active': sortMode === item.value }"
        @click="onClickSortItem(item)"
      >
        {{ item.label }}
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import type { FilterMode, FilterModeListItem, ListType, SortMode, sortModeListItem } from "./actionBar.types";

const emit = defineEmits<{
  "change-sort-mode": [mode: SortMode];
  "change-filter-mode": [mode: FilterMode];
  "change-list-type": [type: ListType];
}>();

const sortMode = defineModel<SortMode>("sortMode", { default: "auto" }); // 排序模式
const sortModeName = computed(() => sortModeList.value.find((item) => item.value === sortMode.value)!.label); // 排序模式名称
const isShowSortPopup = ref(false); // 显示排序选项弹出层
const sortModeList = ref<sortModeListItem[]>([
  { label: "智能排序", value: "auto" },
  { label: "按修改时间", value: "updateDate" },
  { label: "按文件名称", value: "filename" },
  { label: "按文件大小", value: "fileSize" },
  { label: "按文件类型", value: "fileType" }
]); // 排序模式列表
/**
 * 监听点击排序项
 * @param {sortModeListItem} item 排序项
 */
const onClickSortItem = (item: sortModeListItem) => {
  sortMode.value = item.value;
  emit("change-sort-mode", sortMode.value);
  isShowSortPopup.value = false;
};

const filterMode = defineModel<FilterMode>("filterMode", { default: "all" }); // 过滤模式
const isShowFilterList = ref(false); // 是否显示过滤选项列表
const filterModeList = ref<FilterModeListItem[]>([
  { label: "全部", value: "all" },
  { label: "我创建的", value: "myCreate" },
  { label: "其他人创建的", value: "otherCreate" }
]); // 过滤模式列表
/**
 * 监听点击过滤项
 * @param {FilterModeListItem} item 过滤项
 */
const onClickFilterItem = (item: FilterModeListItem) => {
  filterMode.value = item.value;
  emit("change-filter-mode", filterMode.value);
};

const listType = defineModel<ListType>("listType", { default: "grid" }); // 列表模式
/**
 * 监听点击列表类型
 */
const onClickListType = () => {
  listType.value = listType.value === "grid" ? "list" : "grid";
  emit("change-list-type", listType.value);
};
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.action-bar-sort {
  color: #a8adc0;
  display: flex;
  align-items: center;

  &__label {
    font-size: 14px;
  }

  &__icon {
    font-size: 20px;
  }
}

.action-bar-action {
  display: flex;
  align-items: center;

  &__filter {
    background-color: #fcfcfc;
    color: #3e444f;
    font-size: 18px;

    &--active {
      color: $theme-color;
    }
  }

  &__list-type {
    margin-left: 16px;
    color: #babfcd;
    font-size: 20px;

    &-icon {
      display: block;
    }
  }
}

.action-bar-filter-list {
  overflow-y: hidden;
  overflow-x: auto;
  margin: 12px 16px;
  display: flex;

  &__item {
    background-color: #f3f4f8;
    color: #a7aec0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 14px;
    flex-shrink: 0;

    &--active {
      background-color: #0f1726;
      color: #ffffff;
    }

    &:not(:first-child) {
      margin-left: 16px;
    }
  }
}

.action-bar-sort-popup {
  &__title {
    font-size: 18px;
    color: #111626;
    padding: 16px 0;
    text-align: center;
  }

  &__options {
    padding: 16px 48px;

    &-item {
      padding: 16px 0;
      font-size: 14px;
      color: #111624;

      &--active {
        color: $theme-color;
      }
    }
  }
}
</style>
