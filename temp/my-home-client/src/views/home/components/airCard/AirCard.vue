<template>
  <base-card class="air-card" @click="$router.push({ name: 'airControl' })">
    <template #header>
      <div class="air-card__header">
        <div class="mh-title-sm">卧室空调</div>
        <div class="air-card__header-status is-off"></div>
      </div>
    </template>

    <div class="air-card__temperature">
      <span class="air-card__temperature-num">--</span>
      <span class="air-card__temperature-unit">°C</span>
    </div>

    <template #footer>
      <base-button type="info" size="small" @click.stop>
        <template #icon>
          <i-tabler:power />
        </template>
        开机
      </base-button>
    </template>
  </base-card>
</template>

<script lang="ts" setup>
import BaseCard from "@/components-2/base/baseCard/BaseCard.vue";
import BaseButton from "@/components-2/base/baseButton/BaseButton.vue";
</script>

<style lang="scss" scoped>
.air-card {
  .air-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .air-card__header-status {
      width: 8px;
      height: 8px;
      border-radius: var(--mh-radius-round);
      background-color: var(--mh-color-success);

      &.is-off {
        background-color: var(--mh-color-neutral);
      }
    }
  }

  .air-card__temperature {
    text-align: center;
    position: relative;

    .air-card__temperature-num {
      font-size: var(--mh-text-size-9xl);
    }

    .air-card__temperature-unit {
      position: absolute;
      top: 0;
    }
  }
}
</style>
