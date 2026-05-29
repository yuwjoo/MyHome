<template>
  <div class="air-control">
    <layout-header show-back />

    <!-- 空调仪表盘 -->
    <air-dashboard />

    <!-- 空调按键 -->
    <air-keyboard />
  </div>
</template>

<script setup lang="ts">
import LayoutHeader from "@/components-2/layout/layoutHeader/LayoutHeader.vue";
import AirDashboard from "./components/airDashboard/AirDashboard.vue";
import AirKeyboard from "./components/airKeyboard/AirKeyboard.vue";
</script>

<style lang="scss" scoped>
.air-control {
  padding: var(--mh-page-vertical-padding) var(--mh-page-horizontal-padding);
}
</style>
