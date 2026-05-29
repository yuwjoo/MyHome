<template>
  <div class="menu-tabbar">
    <router-link class="menu-tabbar__item" to="/moments" replace>
      <div class="menu-tabbar__content">
        <i-tabler:brand-baidu class="menu-tabbar__icon" />
        <span class="menu-tabbar__title">动态</span>
      </div>
    </router-link>
    <router-link class="menu-tabbar__item" to="/air-conditioner" replace>
      <div class="menu-tabbar__content">
        <i-tabler:air-conditioning class="menu-tabbar__icon" />
        <span class="menu-tabbar__title">空调</span>
      </div>
    </router-link>
    <router-link class="menu-tabbar__item" to="/cloud-drive" replace>
      <div class="menu-tabbar__content">
        <i-tabler:cloud class="menu-tabbar__icon" />
        <span class="menu-tabbar__title">云盘</span>
      </div>
    </router-link>
    <router-link class="menu-tabbar__item" to="/profile" replace>
      <div class="menu-tabbar__content">
        <i-tabler:user class="menu-tabbar__icon" />
        <span class="menu-tabbar__title">我的</span>
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
  background: white;
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
    margin-bottom: 5px;
  }

  &__title {
    font-size: $font-size-small-s;
  }
}
</style>
