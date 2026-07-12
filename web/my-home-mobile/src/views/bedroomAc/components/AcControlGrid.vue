<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Wind Speed -->
    <button
      @click="$emit('toggleWindSpeed')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-card border-border hover:border-primary/40"
      :disabled="!power || isOffline || sending"
      :class="!power || isOffline || sending ? 'opacity-40 cursor-not-allowed' : ''"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="
          power && !isOffline && !sending
            ? 'bg-blue-100 text-blue-500'
            : 'bg-muted text-muted-foreground'
        "
      >
        <WindIcon :size="18" :stroke-width="2" />
      </div>
      <div class="flex flex-col items-start">
        <span class="text-xs font-bold text-foreground">风速</span>
        <span class="text-[10px] mt-0.5 text-muted-foreground">{{ windLabel }}</span>
      </div>
    </button>

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

    <!-- 定时开机 -->
    <button
      @click="$emit('openOnTimerSheet')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
      :disabled="!power || isOffline || sending"
      :class="[
        onTimer > 0
          ? 'bg-amber-500 border-transparent text-white'
          : 'bg-card border-border hover:border-primary/40',
        !power || isOffline || sending ? 'opacity-40 cursor-not-allowed' : '',
      ]"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="onTimer > 0 ? 'bg-white/20' : 'bg-amber-100'"
      >
        <TimerIcon
          :size="18"
          :stroke-width="2"
          :class="onTimer > 0 ? 'text-white' : 'text-amber-500'"
        />
      </div>
      <div class="flex flex-col items-start">
        <span
          class="text-xs font-bold"
          :class="onTimer > 0 ? 'text-white' : 'text-foreground'"
        >定时开机</span>
        <span
          class="text-[10px] mt-0.5"
          :class="onTimer > 0 ? 'text-white/70' : 'text-muted-foreground'"
        >{{ onTimer > 0 ? onTimerLabel : '选择开机时间' }}</span>
      </div>
    </button>

    <!-- 定时关机 -->
    <button
      @click="$emit('openOffTimerSheet')"
      class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
      :class="[
        offTimer > 0
          ? 'bg-violet-500 border-transparent text-white'
          : 'bg-card border-border hover:border-primary/40',
        !power || isOffline || sending ? 'opacity-40 cursor-not-allowed' : '',
      ]"
      :disabled="!power || isOffline || sending"
    >
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="offTimer > 0 ? 'bg-white/20' : 'bg-violet-100'"
      >
        <TimerOffIcon
          :size="18"
          :stroke-width="2"
          :class="offTimer > 0 ? 'text-white' : 'text-violet-500'"
        />
      </div>
      <div class="flex flex-col items-start">
        <span
          class="text-xs font-bold"
          :class="offTimer > 0 ? 'text-white' : 'text-foreground'"
        >定时关机</span>
        <span
          class="text-[10px] mt-0.5"
          :class="offTimer > 0 ? 'text-white/70' : 'text-muted-foreground'"
        >{{ offTimer > 0 ? offTimerLabel : '选择关机时间' }}</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PowerIcon, PlusIcon, MinusIcon, TimerIcon, TimerOffIcon, WindIcon } from 'lucide-vue-next'
import { minutesToTime, WIND_SPEED_MAP } from '../constants'

const props = defineProps<{
  power: boolean
  windSpeed: string
  offTimer: number
  onTimer: number
  isOffline: boolean
  sending: boolean
}>()

defineEmits<{
  togglePower: []
  toggleWindSpeed: []
  increaseTemp: []
  decreaseTemp: []
  openOffTimerSheet: []
  openOnTimerSheet: []
}>()

const windLabel = computed(() => WIND_SPEED_MAP[props.windSpeed] || props.windSpeed)

const offTimerLabel = computed(() =>
  props.offTimer > 0 ? `${minutesToTime(props.offTimer)} 关机` : '',
)

const onTimerLabel = computed(() =>
  props.onTimer > 0 ? `${minutesToTime(props.onTimer)} 开机` : '',
)
</script>
