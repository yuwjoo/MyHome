<template>
  <div v-if="show" class="fixed inset-0 z-50 flex flex-col justify-end">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
    <div
      class="relative bg-background rounded-t-3xl px-6 pt-6 pb-10 shadow-xl max-w-md mx-auto w-full"
    >
      <div class="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />
      <div class="text-lg font-bold text-foreground mb-5">{{ title }}</div>

      <!-- 滚动选择器 -->
      <div class="flex justify-center items-center gap-3 mb-8">
        <!-- 小时列 -->
        <div class="relative w-20" :style="{ height: `${pickerHeight}px` }">
          <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 bg-primary/10 rounded-lg pointer-events-none z-0" />
          <div
            ref="hourScroller"
            class="relative z-10 h-full overflow-y-auto no-scrollbar snap-y snap-mandatory"
            :style="{ padding: `${pickerPadding}px 0` }"
            @scroll="onHourScroll"
          >
            <div
              v-for="h in HOURS"
              :key="h"
              class="h-11 text-center text-xl font-semibold snap-center transition-colors"
              :class="h === selectedHour ? 'text-primary' : 'text-muted-foreground'"
              :style="{ lineHeight: `${ITEM_HEIGHT}px` }"
            >{{ h }}</div>
          </div>
          <!-- 渐变遮罩 -->
          <div class="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background to-transparent z-20" />
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent z-20" />
        </div>

        <!-- 冒号分隔 -->
        <div class="text-xl font-bold text-foreground/60 -mt-1">:</div>

        <!-- 分钟列 -->
        <div class="relative w-20" :style="{ height: `${pickerHeight}px` }">
          <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 bg-primary/10 rounded-lg pointer-events-none z-0" />
          <div
            ref="minuteScroller"
            class="relative z-10 h-full overflow-y-auto no-scrollbar snap-y snap-mandatory"
            :style="{ padding: `${pickerPadding}px 0` }"
            @scroll="onMinuteScroll"
          >
            <div
              v-for="m in MINUTES"
              :key="m"
              class="h-11 text-center text-xl font-semibold snap-center transition-colors"
              :class="m === selectedMinute ? 'text-primary' : 'text-muted-foreground'"
              :style="{ lineHeight: `${ITEM_HEIGHT}px` }"
            >{{ m }}</div>
          </div>
          <div class="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background to-transparent z-20" />
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent z-20" />
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex gap-3">
        <button
          v-if="value"
          @click="$emit('clear')"
          class="flex-1 py-3.5 rounded-2xl bg-muted text-muted-foreground font-medium text-sm active:scale-95 transition-all"
        >清除定时</button>
        <button
          @click="handleConfirm"
          class="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all shadow-custom disabled:opacity-40"
          :disabled="selectedTime === value || selectedTime === '00:00'"
        >确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '30']

const ITEM_HEIGHT = 44
const VISIBLE_COUNT = 4
const pickerHeight = ITEM_HEIGHT * VISIBLE_COUNT // 176
const pickerPadding = (pickerHeight - ITEM_HEIGHT) / 2 // 66

const props = defineProps<{
  show: boolean
  title: string
  value: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [time: string]
  clear: []
}>()

const hourScroller = ref<HTMLElement | null>(null)
const minuteScroller = ref<HTMLElement | null>(null)

const selectedHour = ref('00')
const selectedMinute = ref('00')

const selectedTime = computed(() => `${selectedHour.value}:${selectedMinute.value}`)

watch(() => props.show, async (v) => {
  if (!v) return
  // 回显当前值，空则默认取当前时间
  let h = '00'
  let m = '00'
  if (props.value) {
    const parts = props.value.split(':')
    h = parts[0]
    m = parts[1]
  } else {
    const now = new Date()
    h = String(now.getHours()).padStart(2, '0')
    const mm = Math.round(now.getMinutes() / 30) * 30
    m = mm >= 60 ? '00' : String(mm).padStart(2, '0')
  }
  selectedHour.value = h
  selectedMinute.value = m

  await nextTick()
  if (hourScroller.value) {
    hourScroller.value.scrollTop = HOURS.indexOf(h) * ITEM_HEIGHT
  }
  if (minuteScroller.value) {
    minuteScroller.value.scrollTop = MINUTES.indexOf(m) * ITEM_HEIGHT
  }
})

function onHourScroll() {
  if (!hourScroller.value) return
  const idx = Math.round(hourScroller.value.scrollTop / ITEM_HEIGHT)
  if (idx >= 0 && idx < HOURS.length) selectedHour.value = HOURS[idx]
}

function onMinuteScroll() {
  if (!minuteScroller.value) return
  const idx = Math.round(minuteScroller.value.scrollTop / ITEM_HEIGHT)
  if (idx >= 0 && idx < MINUTES.length) selectedMinute.value = MINUTES[idx]
}

function handleConfirm() {
  emit('confirm', selectedTime.value)
}
</script>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
