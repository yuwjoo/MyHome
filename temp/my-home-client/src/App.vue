<template>
  <van-config-provider :theme="theme" theme-vars-scope="global">
    <router-view />
  </van-config-provider>
</template>

<script setup lang="ts">
import { useThemeStore } from "@/store/theme";
import { storeToRefs } from "pinia";

const { theme } = storeToRefs(useThemeStore());
</script>
