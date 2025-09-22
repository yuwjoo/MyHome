<template>
  <div class="layout-main">
    <menu-navbar v-show="route.meta.main" class="layout-main__header" />
    <div class="layout-main__content">
      <router-view v-slot="{ Component }" :key="bookPlatform.current">
        <keep-alive :include="routerStore.keepAliveList">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <menu-tabbar v-show="route.meta.main" class="layout-main__footer" />
  </div>
</template>

<script setup lang="ts">
import MenuNavbar from "@/layout/components/menu-navbar.vue";
import MenuTabbar from "@/layout/components/menu-tabbar.vue";
import { useRoute } from "@/router";
import { useBook } from "@/store/book";
import { useRouterStore } from "@/store/router";
import { storeToRefs } from "pinia";

defineOptions({
  name: "layout-main"
});

const route = useRoute();

const routerStore = useRouterStore();
const { bookPlatform } = storeToRefs(useBook());
</script>

<style lang="scss" scoped>
.layout-main {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &__header {
    flex-shrink: 0;
  }

  &__content {
    flex-grow: 1;
    height: 0;
    overflow: auto;
  }

  &__footer {
    flex-shrink: 0;
  }
}
</style>
