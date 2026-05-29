<template>
  <base-card class="weather-card">
    <template #header>
      <div class="weather-card__header">
        <div class="mh-title-sm">天气</div>
        <div class="weather-card__header-status">多云</div>
      </div>
    </template>

    <div class="weather-card__temperature">
      <span class="weather-card__temperature-num">24</span>
      <span class="weather-card__temperature-unit">°C</span>
    </div>

    <template #footer>
      <div class="weather-card__info">
        <div class="weather-card__info-item">
          <div class="weather-card__info-label">风速</div>
          <div class="weather-card__info-value">3</div>
        </div>
        <div class="weather-card__info-item">
          <div class="weather-card__info-label">湿度</div>
          <div class="weather-card__info-value">80%</div>
        </div>
        <div class="weather-card__info-item">
          <div class="weather-card__info-label">体感</div>
          <div class="weather-card__info-value">20°C</div>
        </div>
      </div>
    </template>
  </base-card>
</template>

<script lang="ts" setup>
import BaseCard from "@/components-2/base/baseCard/BaseCard.vue";
</script>

<style lang="scss" scoped>
.weather-card {
  .weather-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .weather-card__header-status {
      font-size: var(--mh-text-size-sm);
    }
  }

  .weather-card__temperature {
    text-align: center;
    position: relative;

    .weather-card__temperature-num {
      font-size: var(--mh-text-size-9xl);
    }

    .weather-card__temperature-unit {
      position: absolute;
      top: 0;
    }
  }

  .weather-card__info {
    height: 32px;
    display: flex;
    align-items: center;

    .weather-card__info-item {
      flex-grow: 1;
      text-align: center;
      font-size: var(--mh-text-size-sm);

      .weather-card__info-value {
        margin-top: var(--mh-spacing-xs);
      }
    }
  }
}
</style>
