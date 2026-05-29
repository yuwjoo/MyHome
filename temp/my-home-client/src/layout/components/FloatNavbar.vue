<template>
  <transition name="slide-up-down">
    <nav v-show="isShowNav" class="navbar" :style="navbarStyle">
      <div
        v-for="(item, index) in navItems"
        :key="item.routeName"
        class="navbar__item"
        :class="{ 'navbar__item--active': index === activeIndex }"
        @click="onClickItem(item, index)"
      >
        <component :is="item.icon" class="navbar__item-icon" />
      </div>

      <div class="navbar__overlay"></div>
    </nav>
  </transition>
</template>

<script setup lang="ts">
import HomeFilled from "~icons/tabler/home-filled";
// import AdjustmentsFilled from "~icons/tabler/adjustments-filled";
import CloudFilled from "~icons/tabler/cloud-filled";
import UserFilled from "~icons/tabler/user-filled";
import { useRouter, useRoute } from "@/router";

const router = useRouter();
const route = useRoute();

const isShowNav = ref(true); // 是否显示导航栏
const activeIndex = ref(-1); // 当前激活的导航项索引
const navItems = [
  {
    icon: HomeFilled,
    label: "首页",
    routeName: "home"
  },
  // {
  //   icon: AdjustmentsFilled,
  //   label: "遥控",
  //   routeName: "air-conditioner"
  // },
  {
    icon: CloudFilled,
    label: "云盘",
    routeName: "cloudDisk"
  },
  {
    icon: UserFilled,
    label: "我的",
    routeName: "my"
  }
];
const navbarStyle = computed(() => {
  return {
    "--active-index": activeIndex.value,
    "--item-count": navItems.length
  };
});

/**
 * 监听点击导航项
 * @param item 当前项
 * @param index 当前索引
 */
const onClickItem = (item, index) => {
  activeIndex.value = index;
  router.replace({ name: item.routeName });
};

watchEffect(() => {
  const currentIndex = navItems.findIndex((item) => item.routeName === route.name);
  isShowNav.value = currentIndex !== -1; // 只有在 navItems 中的路由才显示导航栏
  if (currentIndex !== -1) onClickItem(navItems[currentIndex], currentIndex);
});
</script>

<style lang="scss" scoped>
$theme-color: var(--mh-color-primary); // 主题色

$navbar-width: 280px; // 导航栏宽度
$navbar-height: 60px; // 导航栏高度
$navbar-bottom: 20px; // 导航栏距离底部的距离
$navbar-inner-spacing: 10px; // 导航栏内部元素之间的间距

$navbar-item-width: calc(100% / var(--item-count)); // 导航项宽度

$navbar-overlay-size: $navbar-height - $navbar-inner-spacing * 2; // 激活状态导航项底部遮罩大小

.navbar {
  position: fixed;
  bottom: $navbar-bottom;
  left: 0;
  right: 0;
  margin: auto;
  width: $navbar-width;
  height: $navbar-height;
  background-color: #fff;
  border-radius: $navbar-height;
  display: flex;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  z-index: 99;

  .navbar__item {
    width: $navbar-item-width;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-size: 22px;
    color: $theme-color;

    &.navbar__item--active {
      color: #fff;
      transition: color 0.3s 0.15s, font-size 0.3s ease;
    }
  }

  .navbar__overlay {
    position: absolute;
    background-color: $theme-color;
    width: $navbar-overlay-size;
    height: $navbar-overlay-size;
    border-radius: 50%;
    top: $navbar-inner-spacing;
    left: calc($navbar-item-width * var(--active-index) + ($navbar-item-width - $navbar-overlay-size) / 2);
    z-index: -1;
    transition: left 0.3s ease;
  }
}

.slide-up-down-enter-from,
.slide-up-down-leave-to {
  transform: translateY(100px);
}

.slide-up-down-enter-to,
.slide-up-down-leave-from {
  transform: translateY(0);
}

.slide-up-down-enter-active,
.slide-up-down-leave-active {
  transition: all 0.3s ease-in-out;
}
</style>
