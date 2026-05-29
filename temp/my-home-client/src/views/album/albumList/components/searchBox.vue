<!-- 
  * @FileName: SearchBox.vue
  * @FilePath: \my-home-client\src\views\album\albumList\components\SearchBox.vue
  * @Author: YH
  * @Date: 2025-11-30 23:00:54
  * @LastEditors: YH
  * @LastEditTime: 2025-11-30 23:01:28
  * @Description: 搜索框组件
 -->

<template>
  <div class="search-box">
    <i-tabler-search class="search-box__search-icon" />
    <input class="search-box__input" type="text" placeholder="搜索相册名称" v-model="modelValue" />
  </div>
</template>

<script setup lang="ts">
const modelValue = defineModel({
  type: String
}); // 输入的文字
</script>

<style lang="scss" scoped>
$borderColor: $font-color-dd; // 边框颜色
$bgColor: transparent; // 背景颜色

.search-box {
  display: flex;
  padding: 10px 15px;
  box-sizing: border-box;
  border: 3px solid $borderColor;
  border-radius: 16px;
  background-color: $bgColor;

  &__search-icon {
    font-size: 26px;
    color: $borderColor;
    flex-shrink: 0;
  }

  &__input {
    width: 0;
    background-color: transparent;
    border: none;
    flex-grow: 1;
    color: $font-color-dd;
    padding: 0;
    margin-left: 5px;

    &::placeholder {
      color: $font-color;
    }
  }
}
</style>
