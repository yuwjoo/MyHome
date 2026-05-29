<template>
  <div class="add-moment-btn" @click="$emit('click')">
    <i-tabler:plus class="add-moment-btn__icon" />
  </div>
</template>

<script setup lang="ts">
// 定义emit
defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.add-moment-btn {
  position: fixed;
  bottom: 70px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #1989fa;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(25, 137, 250, 0.4);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(25, 137, 250, 0.5);
  }

  &__icon {
    font-size: 30px;
  }
}
</style>
