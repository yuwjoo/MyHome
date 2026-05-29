<script setup lang="ts">
/**
 * BottomSheet.vue —— 通用底部抽屉（遮罩 + 滑出面板）
 * @props visible - 是否显示
 * @props title - 标题（可选）
 * @emits close - 点击遮罩或关闭
 *
 * 打开时自动锁定 body 滚动，关闭时恢复
 */
import { watch } from 'vue'

const props = defineProps<{
  visible: boolean
  title?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

/** 打开弹层时禁止 body 滚动，关闭时恢复 */
watch(
  () => props.visible,
  (v) => {
    if (v) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center transition-all duration-200"
    :class="visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
  >
    <!-- 遮罩（阻止触摸穿透） -->
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')" @touchmove.prevent />

    <!-- 面板 -->
    <div
      class="relative w-full max-w-md bg-card rounded-t-3xl px-6 pt-5 pb-10 shadow-custom transition-transform duration-300"
      :class="visible ? 'translate-y-0' : 'translate-y-full'"
    >
      <!-- 拖拽条 -->
      <div class="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

      <!-- 标题 -->
      <div v-if="title" class="text-base font-bold text-foreground mb-5">{{ title }}</div>

      <!-- 内容 -->
      <slot />
    </div>
  </div>
</template>
