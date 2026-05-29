<template>
  <div class="air-keyboard-warp">
    <base-card class="air-keyboard">
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key">
          <i-tabler:minus class="air-keyboard__item-key-icon" />
        </div>
      </div>
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key">
          <i-tabler:power class="air-keyboard__item-key-icon" />
        </div>
      </div>
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key">
          <i-tabler:plus class="air-keyboard__item-key-icon" />
        </div>
      </div>
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key">
          <i-tabler:windmill class="air-keyboard__item-key-icon" />
          <div class="air-keyboard__item-key-label">风速</div>
        </div>
      </div>
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key">
          <i-tabler:direction-arrows class="air-keyboard__item-key-icon" />
          <div class="air-keyboard__item-key-label">风向</div>
        </div>
      </div>
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key" @click="() => timedPopupRef?.open()">
          <i-tabler:calendar-time class="air-keyboard__item-key-icon" />
          <div class="air-keyboard__item-key-label">定时</div>
        </div>
      </div>
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key">
          <i-tabler:user-screen class="air-keyboard__item-key-icon" />
          <div class="air-keyboard__item-key-label">屏显</div>
        </div>
      </div>
      <div class="air-keyboard__item">
        <div class="air-keyboard__item-key">
          <i-tabler:brand-tailwind class="air-keyboard__item-key-icon" />
          <div class="air-keyboard__item-key-label">模式</div>
        </div>
      </div>
    </base-card>

    <!-- 定时弹出层 -->
    <timed-popup ref="timedPopup" />
  </div>
</template>

<script lang="ts" setup>
import BaseCard from "@/components-2/base/baseCard/BaseCard.vue";
import TimedPopup from "./TimedPopup.vue";
import type { AirKeyboardEmits } from "./types";

defineEmits<AirKeyboardEmits>();

const timedPopupRef = useTemplateRef("timedPopup");
</script>

<style lang="scss" scoped>
.air-keyboard {
  margin-top: 16px;

  &.base-card {
    :deep(.base-card__body) {
      padding: 16px 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      row-gap: 16px;
    }
  }

  .air-keyboard__item {
    display: flex;
    justify-content: center;
    align-items: center;

    .air-keyboard__item-key {
      border-radius: 50px;
      padding: 10px;
      box-shadow: var(--mh-shadow-sm);
      width: 60px;
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      &:active {
        background-color: var(--mh-color-neutral-100);
      }

      .air-keyboard__item-key-icon {
        font-size: 30px;
      }

      .air-keyboard__item-key-label {
        margin-top: 4px;
        font-size: 12px;
      }
    }
  }
}
</style>
