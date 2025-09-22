<template>
  <div class="menu-tabbar">
    <router-link class="menu-tabbar__item" to="/book-city" replace>
      <div class="menu-tabbar__content">
        <i class="menu-tabbar__icon icon-bookshelf"></i>
        <span class="menu-tabbar__title">书城</span>
      </div>
    </router-link>
    <router-link class="menu-tabbar__item" to="/book-search" replace>
      <div class="menu-tabbar__content">
        <i class="menu-tabbar__icon icon-search"></i>
        <span class="menu-tabbar__title">搜索</span>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "menu-tabbar"
});
</script>

<style lang="scss" scoped>
.menu-tabbar {
  height: 50px;
  box-sizing: border-box;
  background: $background-color-d;
  border-top: 1px solid $border-color-m;
  display: flex;

  &__item {
    flex: 1;
    text-decoration: none;
    color: $font-color;

    &.router-link-active {
      color: $theme-color;
    }
  }

  &__content {
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  &__icon {
    font-size: $font-size-large-x;
    margin-bottom: 10px;
  }

  &__title {
    font-size: $font-size-small-s;
  }
}
</style>
