<template>
  <dynamic-scroller
    class="virtual-list"
    :items="list"
    :min-item-size="minItemSize"
    :buffer="buffer"
    :keyField="keyField"
    emit-update
    @update="handleUpdate"
  >
    <template #default="{ item, index, active }">
      <dynamic-scroller-item :item="item" :active="active" :data-index="index">
        <slot :item="item" :active="active" :index="index" />
      </dynamic-scroller-item>
    </template>
    <template v-if="loading" #after>
      <div class="virtual-list__loading"><van-loading /></div>
    </template>
    <template v-else-if="listLength === 0" #empty>
      <div class="virtual-list__empty">暂无数据</div>
    </template>
  </dynamic-scroller>
</template>

<script setup lang="ts">
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";

defineOptions({
  name: "virtual-list"
});

const emit = defineEmits<{
  "scroll-to-bottom": [];
  "current-visible": [item: any, index: number];
}>();

const props = defineProps({
  // 列表数据
  list: {
    type: Array,
    required: true
  },
  // item最小尺寸
  minItemSize: {
    type: Number,
    required: true
  },
  // 滚动缓冲区
  buffer: {
    type: Number,
    default: 500
  },
  // 加载中
  loading: {
    type: Boolean,
    default: false
  },
  // item唯一key
  keyField: {
    type: String,
    required: true
  }
});

const listLength = computed(() => props.list.length); // 列表长度

const af = ref<number>(); // 动画帧Id

/**
 * @description: 处理视图更新
 * @param {number} _startIndex 起始渲染位置
 * @param {number} endIndex 结束渲染位置
 * @param {number} _visibleStartIndex 起始可视位置
 * @param {number} visibleEndIndex 结束可视位置
 */
const handleUpdate = (_startIndex: number, endIndex: number, _visibleStartIndex: number, visibleEndIndex: number) => {
  if (af.value !== undefined) cancelAnimationFrame(af.value);
  af.value = requestAnimationFrame(() => {
    if (endIndex === listLength.value) {
      emit("scroll-to-bottom");
    }
    emit("current-visible", props.list[visibleEndIndex], visibleEndIndex);
  });
};
</script>

<style lang="scss" scoped>
.virtual-list {
  &__empty {
    text-align: center;
    padding: 10px 0;
  }

  &__loading {
    text-align: center;
    padding: 10px 0;
  }
}
</style>
