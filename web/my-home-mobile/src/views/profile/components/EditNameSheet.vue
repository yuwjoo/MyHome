<script setup lang="ts">
/**
 * EditNameSheet.vue —— 修改昵称底部抽屉
 */
import BottomSheet from '@/components/ui/BottomSheet.vue'

defineProps<{
  visible: boolean
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'save'): void
  (e: 'close'): void
}>()
</script>

<template>
  <BottomSheet :visible="visible" title="修改昵称" @close="emit('close')">
    <input
      :value="modelValue"
      class="w-full bg-muted rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary transition-colors"
      placeholder="请输入新昵称"
      maxlength="20"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <div class="flex gap-3 mt-5">
      <button
        class="flex-1 py-3.5 rounded-2xl bg-muted text-foreground font-semibold text-sm"
        @click="emit('close')"
      >取消</button>
      <button
        class="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
        @click="emit('save')"
      >保存</button>
    </div>
  </BottomSheet>
</template>
