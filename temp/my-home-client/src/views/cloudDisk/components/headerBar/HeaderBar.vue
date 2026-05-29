<template>
  <div class="header-bar">
    <layout-header class="header-bar__header">
      <base-search-box class="header-bar__header-search" />
      <template #right>
        <div class="header-bar__header-operation">
          <i-tabler:plus class="header-bar__header-operation-plus" @click="actionPopupRef?.open()" />
        </div>
      </template>
    </layout-header>

    <!-- 动作弹出层 -->
    <action-popup ref="actionPopupRef" :dir-path="props.dirPath" @change="emit('change')" />
  </div>
</template>

<script lang="ts" setup>
import LayoutHeader from "@/components-2/layout/layoutHeader/LayoutHeader.vue";
import BaseSearchBox from "@/components-2/base/baseSearchBox/BaseSearchBox.vue";
import ActionPopup from "../actionPopup/ActionPopup.vue";
import { headerBarProps } from "./define/props";
import type { HeaderBarEmits } from "./define/emits";

const props = defineProps(headerBarProps);
const emit = defineEmits<HeaderBarEmits>();

const actionPopupRef = useTemplateRef("actionPopupRef"); // 动作弹出层 ref
</script>

<style lang="scss" scoped>
.header-bar {
  .header-bar__header {
    .header-bar__header-search {
      width: 170px;
    }

    .header-bar__header-operation {
      font-size: 24px;
      display: flex;
      align-items: center;
      height: 100%;
    }
  }
}
</style>
