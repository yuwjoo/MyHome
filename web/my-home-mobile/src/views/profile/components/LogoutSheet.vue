<script setup lang="ts">
/**
 * LogoutSheet.vue —— 退出登录确认底部抽屉
 */
import { LogOutIcon } from 'lucide-vue-next'
import BottomSheet from '@/components/ui/BottomSheet.vue'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()
</script>

<template>
  <BottomSheet :visible="visible" @close="$emit('close')">
    <div class="text-center mb-6">
      <div class="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-3" style="background: rgba(234, 88, 60, 0.1)">
        <LogOutIcon :size="22" :stroke-width="2" style="color: rgba(218, 72, 44, 1)" />
      </div>
      <div class="text-base font-bold text-foreground mb-1">确认退出登录？</div>
      <div class="text-xs text-muted-foreground">退出后将返回登录页面</div>
    </div>
    <div class="flex gap-3">
      <button
        class="flex-1 py-4 rounded-2xl bg-muted text-foreground font-semibold text-sm"
        @click="$emit('close')"
      >取消</button>
      <button
        class="flex-1 py-4 rounded-2xl bg-destructive text-white font-semibold text-sm"
        @click="$emit('confirm')"
      >确认退出</button>
    </div>
  </BottomSheet>
</template>
