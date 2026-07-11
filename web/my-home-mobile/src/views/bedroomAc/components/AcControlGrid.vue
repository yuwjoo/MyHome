<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Power -->
    <button
      @click="$emit('togglePower')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
      :class="
        power
          ? 'bg-cyan-500 border-transparent text-white'
          : 'bg-card border-border text-muted-foreground'
      "
      :disabled="isOffline || sending"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="power ? 'bg-white/20' : 'bg-muted'"
      >
        <PowerIcon
          :size="18"
          :stroke-width="2.5"
          :class="power ? 'text-white' : 'text-muted-foreground'"
        />
      </div>
      <div class="flex flex-col items-start">
        <span
          class="text-xs font-bold"
          :class="power ? 'text-white' : 'text-foreground'"
        >开关机</span>
        <span
          class="text-[10px] mt-0.5"
          :class="power ? 'text-white/70' : 'text-muted-foreground'"
        >{{ power ? '点击关机' : '点击开机' }}</span>
      </div>
    </button>

    <!-- Temp - -->
    <button
      @click="$emit('decreaseTemp')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-card border-border hover:border-primary/40"
      :disabled="!power || isOffline || sending"
      :class="!power || isOffline || sending ? 'opacity-40 cursor-not-allowed' : ''"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="
          power && !isOffline && !sending
            ? 'bg-cyan-100 text-cyan-500'
            : 'bg-muted text-muted-foreground'
        "
      >
        <MinusIcon :size="18" :stroke-width="2.5" />
      </div>
      <div class="flex flex-col items-start">
        <span class="text-xs font-bold text-foreground">降温</span>
        <span class="text-[10px] mt-0.5 text-muted-foreground">最低 16°C</span>
      </div>
    </button>

    <!-- Timer (cancel / set) -->
    <button
      v-if="offTimer > 0 || onTimer > 0"
      @click="$emit('cancelTimer')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-primary/10 border-primary/30"
      :disabled="isOffline || sending"
      :class="isOffline || sending ? 'opacity-40 cursor-not-allowed' : ''"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="
          !isOffline && !sending
            ? 'bg-primary/20 text-primary'
            : 'bg-muted text-muted-foreground'
        "
      >
        <TimerOffIcon :size="18" :stroke-width="2" />
      </div>
      <div class="flex flex-col items-start">
        <span class="text-xs font-bold text-primary">取消定时</span>
        <span class="text-[10px] mt-0.5 text-primary/70">{{ timerDetail }}</span>
      </div>
    </button>
    <button
      v-else
      @click="$emit('openTimerSheet')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-card border-border hover:border-primary/40"
      :disabled="!power || isOffline || sending"
      :class="!power || isOffline || sending ? 'opacity-40 cursor-not-allowed' : ''"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="
          power && !isOffline && !sending
            ? 'bg-violet-100 text-violet-500'
            : 'bg-muted text-muted-foreground'
        "
      >
        <TimerIcon :size="18" :stroke-width="2" />
      </div>
      <div class="flex flex-col items-start">
        <span class="text-xs font-bold text-foreground">定时</span>
        <span class="text-[10px] mt-0.5 text-muted-foreground">设置定时关机</span>
      </div>
    </button>

    <!-- Temp + -->
    <button
      @click="$emit('increaseTemp')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-card border-border hover:border-primary/40"
      :disabled="!power || isOffline || sending"
      :class="!power || isOffline || sending ? 'opacity-40 cursor-not-allowed' : ''"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="
          power && !isOffline && !sending
            ? 'bg-orange-100 text-orange-500'
            : 'bg-muted text-muted-foreground'
        "
      >
        <PlusIcon :size="18" :stroke-width="2.5" />
      </div>
      <div class="flex flex-col items-start">
        <span class="text-xs font-bold text-foreground">升温</span>
        <span class="text-[10px] mt-0.5 text-muted-foreground">最高 30°C</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PowerIcon, PlusIcon, MinusIcon, TimerIcon, TimerOffIcon } from 'lucide-vue-next'
import { formatMinutes } from '../constants'

const props = defineProps<{
  power: boolean
  offTimer: number
  onTimer: number
  isOffline: boolean
  sending: boolean
}>()

defineEmits<{
  togglePower: []
  increaseTemp: []
  decreaseTemp: []
  cancelTimer: []
  openTimerSheet: []
}>()

const timerDetail = computed(() => {
  if (props.offTimer > 0) return `定时 ${formatMinutes(props.offTimer)} 后关机`
  if (props.onTimer > 0) return `定时 ${formatMinutes(props.onTimer)} 后开机`
  return ''
})
</script>
