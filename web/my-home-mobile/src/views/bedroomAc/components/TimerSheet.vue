<template>
  <div v-if="show" class="fixed inset-0 z-50 flex flex-col justify-end">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
    <div
      class="relative bg-background rounded-t-3xl px-5 pt-5 pb-10 shadow-xl max-w-md mx-auto w-full"
    >
      <div class="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />
      <div class="text-base font-bold text-foreground mb-1">设置定时</div>
      <div class="text-xs text-muted-foreground mb-5">选择多少时间后自动关机，最长 12 小时</div>

      <!-- 预设时间 -->
      <div class="grid grid-cols-5 gap-2 mb-6">
        <button
          v-for="min in TIMER_OPTIONS"
          :key="min"
          @click="draft = min"
          class="py-2.5 rounded-2xl text-xs font-semibold border transition-all active:scale-95"
          :class="
            draft === min
              ? 'bg-primary text-primary-foreground border-transparent shadow-custom'
              : 'bg-card border-border text-muted-foreground'
          "
        >
          {{ formatMinutes(min) }}
        </button>
      </div>
      <button
        @click="handleConfirm"
        :disabled="draft === null"
        class="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all shadow-custom disabled:opacity-40"
      >
        确认设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TIMER_OPTIONS, formatMinutes } from '../constants'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [minutes: number]
}>()

const draft = ref<number | null>(60)

function handleConfirm() {
  if (draft.value === null) return
  emit('confirm', draft.value)
}
</script>
