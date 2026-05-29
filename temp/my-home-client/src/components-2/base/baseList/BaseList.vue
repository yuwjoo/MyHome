<template>
  <van-pull-refresh v-model="refreshLoading" :disabled="disabledRefresh" @refresh="onRefresh()">
    <van-list
      v-model:loading="loadLoading"
      v-model:error="isError"
      :disabled="disabledLoad"
      :finished="isFinished"
      :error-text="list.length > 0 ? '请求失败，点击重新加载' : ''"
      immediate-check
      @load="onLoad()"
    >
      <slot :datas="list">
        <template v-for="(item, index) in list" :key="index">
          <slot name="item" :data="item" :index="index" />
        </template>
      </slot>

      <template v-if="list.length === 0 && !refreshLoading && !loadLoading">
        <van-empty v-if="isError" image="error" description="请求失败，点击重新加载" @click="onLoad()" />
        <van-empty v-else description="暂无数据" />
      </template>
    </van-list>
  </van-pull-refresh>
</template>

<script lang="ts" setup>
import { baseListModels, baseListProps } from "./props";
import type { BaseListSlots } from "./types";

defineSlots<BaseListSlots>();
const props = defineProps(baseListProps);

const list = defineModel(baseListModels.modelValue); // 列表数据
const refreshLoading = ref(false); // 刷新中
const loadLoading = ref(false); // 加载中
const pageNum = ref(0); // 当前页
const dataTotal = ref(Infinity); // 数据总数
const isFinished = ref(false); // 是否加载完成
const isError = ref(false); // 是否加载异常

/**
 * 加载数据
 * @param curPageNum 当前页
 */
const loadData = async (curPageNum: number) => {
  if (!props.loadFun) return;

  try {
    const res = await props.loadFun({
      pageNum: curPageNum,
      pageSize: props.pageSize
    });

    const offset = (curPageNum - 1) * props.pageSize;
    const endPos = offset + props.pageSize - 1;
    list.value.splice(offset, endPos, ...res.datas);

    pageNum.value = curPageNum;
    dataTotal.value = res.total ?? Infinity;
    isFinished.value = res.isFinished || list.length >= dataTotal.value;
  } catch {
    isError.value = true;
  }
};

/**
 * 监听下拉刷新
 */
const onRefresh = async () => {
  try {
    list.value = [];
    pageNum.value = 0;
    await loadData(pageNum.value + 1);
  } finally {
    refreshLoading.value = false;
  }
};

/**
 * 监听滚动加载
 */
const onLoad = async () => {
  loadLoading.value = true;
  try {
    await loadData(pageNum.value + 1);
  } finally {
    loadLoading.value = false;
  }
};

/**
 * 重置数据
 */
const resetData = async () => {
  list.value = [];
  pageNum.value = 0;
  await onLoad();
};

onMounted(() => {
  if (props.immediateLoad) onLoad();
});

defineExpose({ resetData });
</script>

<style lang="scss" scoped></style>
