<template>
  <div class="home">
    <layout-header class="home_header">
      <base-search-box class="home_header__search" />
      <template #right>
        <div class="home_header__operation">
          <i-tabler:line-scan class="home_header__operation__scan" />
        </div>
      </template>
    </layout-header>

    <div class="home__block-title mh-title-md">快捷卡片</div>

    <div class="home__quick-card-box">
      <!-- 天气卡片 -->
      <weather-card />

      <!-- 空调卡片 -->
      <air-card />
    </div>

    <div class="home__block-title mh-title-md">功能入口</div>

    <div class="home__menu-list">
      <menu-item v-for="(item, index) in menuList" :key="index" :item="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import WeatherCard from "./components/weatherCard/WeatherCard.vue";
import AirCard from "./components/airCard/AirCard.vue";

import DeviceGamepad2 from "~icons/tabler/device-gamepad-2";
import accessible from "~icons/tabler/accessible";
import ActivityHeartbeat from "~icons/tabler/activity-heartbeat";
import AlignBoxRightStretch from "~icons/tabler/align-box-right-stretch";
import Angle from "~icons/tabler/angle";
import BabyCarriage from "~icons/tabler/baby-carriage";
import Baguette from "~icons/tabler/baguette";
import BasketMinus from "~icons/tabler/basket-minus";
import MenuItem from "./components/menuItem/MenuItem.vue";
import BaseSearchBox from "@/components-2/base/baseSearchBox/BaseSearchBox.vue";
import LayoutHeader from "@/components-2/layout/layoutHeader/LayoutHeader.vue";

const menuList = ref([
  { icon: DeviceGamepad2, label: "遥控小车" },
  { icon: accessible, label: "快递" },
  { icon: ActivityHeartbeat, label: "小游戏" },
  { icon: AlignBoxRightStretch, label: "电动车状态" },
  { icon: Angle, label: "找不同辅助" },
  { icon: BabyCarriage, label: "存钱罐" },
  { icon: Baguette, label: "基金" },
  { icon: BasketMinus, label: "远程手机" },
  { icon: BasketMinus, label: "远程手机" },
  { icon: BasketMinus, label: "远程手机" },
  { icon: BasketMinus, label: "远程手机" },
  { icon: BasketMinus, label: "远程手机" },
  { icon: BasketMinus, label: "远程手机" },
  { icon: BasketMinus, label: "远程手机" }
]); // 菜单列表
</script>

<style lang="scss" scoped>
.home {
  padding: var(--mh-page-vertical-padding) var(--mh-page-horizontal-padding)
    calc(80px + var(--mh-page-vertical-padding));

  .home_header {
    .home_header__search {
      width: 170px;
    }

    .home_header__operation {
      font-size: var(--mh-text-size-3xl);
      display: flex;
      align-items: center;
      height: 100%;
    }
  }

  .home__block-title {
    margin-top: var(--mh-spacing-lg);
    text-indent: var(--mh-spacing-sm);
    position: relative;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 80%;
      background-color: var(--mh-color-primary);
    }
  }

  .home__quick-card-box {
    margin-top: var(--mh-spacing-sm);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--mh-spacing-lg);
  }

  .home__menu-list {
    margin-top: var(--mh-spacing-sm);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--mh-spacing-lg);
  }
}
</style>
