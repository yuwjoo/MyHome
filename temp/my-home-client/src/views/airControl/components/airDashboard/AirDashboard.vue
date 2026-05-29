<template>
  <base-card class="air-dashboard">
    <div class="air-dashboard__temperature">
      <div class="air-dashboard__temperature-num">22</div>
      <div class="air-dashboard__temperature-unit">°C</div>
    </div>

    <div class="air-dashboard__mode">
      <!-- 制冷模式 -->
      <i-tabler:snowflake class="air-dashboard__mode-icon is-snowflake" />
      <!-- 制热模式 -->
      <!-- <i-tabler:sun class="air-dashboard__mode-icon is-sun" /> -->
      <div class="air-dashboard__mode-text">制冷模式</div>
    </div>

    <div class="air-dashboard__info">
      <div class="air-dashboard__info-item">
        <div class="air-dashboard__info-item-value">auto</div>
        <div class="air-dashboard__info-item-label">风速</div>
      </div>
      <div class="air-dashboard__info-item">
        <div class="air-dashboard__info-item-value">
          <!-- 上下扫风 -->
          <i-tabler:arrows-move-vertical />
          <!-- 左右扫风 -->
          <!-- <i-tabler:arrows-move-horizontal /> -->
        </div>
        <div class="air-dashboard__info-item-label">风向</div>
      </div>
      <div class="air-dashboard__info-item">
        <div class="air-dashboard__info-item-value">01:59:59</div>
        <div class="air-dashboard__info-item-label">定时</div>
      </div>
    </div>
  </base-card>
</template>

<script lang="ts" setup>
import BaseCard from "@/components-2/base/baseCard/BaseCard.vue";
</script>

<style lang="scss" scoped>
.air-dashboard {
  margin-top: 16px;

  &.base-card {
    :deep(.base-card__body) {
      display: flex;
      align-items: center;
      flex-direction: column;
      padding: var(--mh-spacing-lg);
    }
  }

  .air-dashboard__temperature {
    position: relative;

    .air-dashboard__temperature-num {
      font-size: 76px;
      color: var(--mh-color-neutral-900);
    }

    .air-dashboard__temperature-unit {
      font-size: 24px;
      position: absolute;
      top: 0;
      right: -20px;
    }
  }

  .air-dashboard__mode {
    display: flex;
    align-items: center;

    .air-dashboard__mode-icon {
      &.is-snowflake {
        color: var(--mh-color-success);
      }

      &.is-sun {
        color: var(--mh-color-danger);
      }
    }

    .air-dashboard__mode-text {
      margin-left: var(--mh-spacing-xs);
      font-size: var(--mh-text-size-lg);
    }
  }

  .air-dashboard__info {
    margin-top: 16px;
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 60px;

    .air-dashboard__info-item {
      display: flex;
      align-items: center;
      flex-direction: column;
      height: 100%;
      width: calc(100% / 3);
      color: var(--mh-secondary-text-color);
      font-size: var(--mh-secondary-text-size);
      line-height: var(--mh-secondary-line-height);

      .air-dashboard__info-item-value {
        flex-grow: 1;
      }

      .air-dashboard__info-item-label {
        margin-top: var(--mh-spacing-xs);
      }
    }
  }
}
</style>
