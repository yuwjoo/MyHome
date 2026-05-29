<template>
  <div
    data-cmp="AcRemoteView"
    class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-10"
  >
    <header class="px-5 pt-10 pb-4 flex items-center gap-3">
      <button
        @click="router.back()"
        class="w-9 h-9 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
      >
        <ChevronLeftIcon :size="18" class="text-foreground" :stroke-width="2.5" />
      </button>
      <div class="flex-1">
        <div class="text-xl font-bold text-foreground">主卧空调</div>
        <div class="text-xs text-muted-foreground mt-0.5">智能遥控器</div>
      </div>
    </header>

    <!-- Dashboard -->
    <div class="px-5 mb-6">
      <div
        class="rounded-3xl px-6 py-6 shadow-custom transition-all"
        :class="isOn ? 'storage-gradient' : 'bg-muted'"
      >
        <div class="flex items-end justify-between mb-5">
          <div>
            <div
              class="text-xs font-medium mb-1"
              :class="isOn ? 'text-white/60' : 'text-muted-foreground'"
            >
              设定温度
            </div>
            <div
              class="text-7xl font-bold leading-none tracking-tight"
              :class="isOn ? 'text-white' : 'text-muted-foreground'"
            >
              {{ temperature }}
              <span
                class="text-3xl font-semibold ml-1"
                :class="isOn ? 'text-white/70' : 'text-muted-foreground/70'"
                >°C</span
              >
            </div>
          </div>
          <div
            class="flex flex-col items-end gap-1 text-right"
            :class="isOn ? 'text-white/50' : 'text-muted-foreground/50'"
          >
            <div
              class="text-xs font-semibold px-2 py-0.5 rounded-full"
              :class="
                isOn
                  ? 'bg-white/15 text-white/80'
                  : 'bg-muted-foreground/10 text-muted-foreground/60'
              "
            >
              {{ isOn ? '运行中' : '已关闭' }}
            </div>
          </div>
        </div>

        <div
          class="grid grid-cols-4 gap-3 pt-4 border-t"
          :class="isOn ? 'border-white/15' : 'border-muted-foreground/10'"
        >
          <div class="flex flex-col items-center gap-1">
            <ThermometerIcon
              :size="14"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
              :stroke-width="2"
            />
            <div
              class="text-[10px] font-medium"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
            >
              模式
            </div>
            <div class="text-xs font-bold" :class="isOn ? 'text-white' : 'text-muted-foreground'">
              {{ modeLabel }}
            </div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <GaugeIcon
              :size="14"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
              :stroke-width="2"
            />
            <div
              class="text-[10px] font-medium"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
            >
              风速
            </div>
            <div class="text-xs font-bold" :class="isOn ? 'text-white' : 'text-muted-foreground'">
              {{ fanLabel }}
            </div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <WindIcon
              :size="14"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
              :stroke-width="2"
            />
            <div
              class="text-[10px] font-medium"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
            >
              风向
            </div>
            <div class="text-xs font-bold" :class="isOn ? 'text-white' : 'text-muted-foreground'">
              {{ swingLabel }}
            </div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <MoonIcon
              :size="14"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
              :stroke-width="2"
            />
            <div
              class="text-[10px] font-medium"
              :class="isOn ? 'text-white/50' : 'text-muted-foreground/40'"
            >
              睡眠
            </div>
            <div class="text-xs font-bold" :class="isOn ? 'text-white' : 'text-muted-foreground'">
              {{ sleepOn ? '开启' : '关闭' }}
            </div>
          </div>
        </div>

        <div
          v-if="timerMinutes !== null"
          class="mt-3 pt-3 border-t flex items-center gap-1.5"
          :class="
            isOn
              ? 'border-white/15 text-white/70'
              : 'border-muted-foreground/10 text-muted-foreground/60'
          "
        >
          <TimerIcon :size="12" :stroke-width="2" />
          <span class="text-xs font-medium">{{ timerLabel }} 后关机</span>
        </div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="px-5">
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="handlePower"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            isOn
              ? 'bg-cyan-500 border-transparent text-white'
              : 'bg-card border-border text-muted-foreground'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isOn ? 'bg-white/20' : 'bg-muted'"
          >
            <PowerIcon
              :size="18"
              :stroke-width="2.5"
              :class="isOn ? 'text-white' : 'text-muted-foreground'"
            />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold" :class="isOn ? 'text-white' : 'text-foreground'">开关机</span>
            <span
              class="text-[10px] mt-0.5"
              :class="isOn ? 'text-white/70' : 'text-muted-foreground'"
              >{{ isOn ? '当前开启' : '当前关闭' }}</span
            >
          </div>
        </button>

        <button
          @click="adjustTemp(1)"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : 'bg-card border-border hover:border-primary/40'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isOn ? 'bg-orange-100 text-orange-500' : 'bg-muted text-muted-foreground'"
          >
            <PlusIcon :size="18" :stroke-width="2.5" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">升温</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">最高 30°C</span>
          </div>
        </button>

        <button
          @click="adjustTemp(-1)"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : 'bg-card border-border hover:border-primary/40'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isOn ? 'bg-cyan-100 text-cyan-500' : 'bg-muted text-muted-foreground'"
          >
            <MinusIcon :size="18" :stroke-width="2.5" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">降温</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">最低 16°C</span>
          </div>
        </button>

        <button
          v-if="timerMinutes !== null"
          @click="cancelTimer"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : 'bg-primary/10 border-primary/30'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isOn ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'"
          >
            <TimerIcon :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold" :class="isOn ? 'text-primary' : 'text-foreground'">取消定时</span>
            <span
              class="text-[10px] mt-0.5"
              :class="isOn ? 'text-primary/70' : 'text-muted-foreground'"
              >{{ timerLabel }} 后关机</span
            >
          </div>
        </button>
        <button
          v-else
          @click="isOn && (showTimerSheet = true)"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : 'bg-card border-border hover:border-primary/40'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isOn ? 'bg-violet-100 text-violet-500' : 'bg-muted text-muted-foreground'"
          >
            <TimerIcon :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">定时</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">设置关机时间</span>
          </div>
        </button>

        <button
          @click="cycleSwing"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : 'bg-card border-border hover:border-primary/40'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isOn ? 'bg-sky-100 text-sky-500' : 'bg-muted text-muted-foreground'"
          >
            <ArrowUpDownIcon :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">风向</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">{{ swingLabel }}</span>
          </div>
        </button>

        <button
          @click="cycleFan"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : 'bg-card border-border hover:border-primary/40'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="isOn ? 'bg-teal-100 text-teal-500' : 'bg-muted text-muted-foreground'"
          >
            <WindIcon :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">风速</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">{{ fanLabel }}</span>
          </div>
        </button>

        <button
          @click="cycleMode"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : 'bg-card border-border hover:border-primary/40'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="
              isOn
                ? modeIdx === 0
                  ? 'bg-cyan-100 text-cyan-500'
                  : 'bg-orange-100 text-orange-500'
                : 'bg-muted text-muted-foreground'
            "
          >
            <SunIcon v-if="modeIdx === 0" :size="18" :stroke-width="2" />
            <ThermometerIcon v-else :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">模式</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">{{ modeLabel }}</span>
          </div>
        </button>

        <button
          @click="toggleSleep"
          :disabled="!isOn"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            !isOn
              ? 'opacity-40 cursor-not-allowed bg-card border-border'
              : sleepOn
                ? 'bg-indigo-500 border-transparent text-white'
                : 'bg-card border-border hover:border-primary/40'
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="
              !isOn
                ? 'bg-muted text-muted-foreground'
                : sleepOn
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-500'
            "
          >
            <MoonIcon :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span
              class="text-xs font-bold"
              :class="!isOn ? 'text-foreground' : sleepOn ? 'text-white' : 'text-foreground'"
              >睡眠</span
            >
            <span
              class="text-[10px] mt-0.5"
              :class="
                !isOn
                  ? 'text-muted-foreground'
                  : sleepOn
                    ? 'text-white/70'
                    : 'text-muted-foreground'
              "
              >{{ sleepOn ? '已开启' : '已关闭' }}</span
            >
          </div>
        </button>
      </div>
    </div>

    <!-- Timer Bottom Sheet -->
    <div v-if="showTimerSheet" class="fixed inset-0 z-50 flex flex-col justify-end">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showTimerSheet = false" />
      <div
        class="relative bg-background rounded-t-3xl px-5 pt-5 pb-10 shadow-xl max-w-md mx-auto w-full"
      >
        <div class="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />
        <div class="text-base font-bold text-foreground mb-1">设置定时</div>
        <div class="text-xs text-muted-foreground mb-5">选择多少时间后自动关机</div>
        <div class="grid grid-cols-5 gap-2 mb-6">
          <button
            v-for="min in TIMER_OPTIONS"
            :key="min"
            @click="timerDraft = min"
            class="py-2.5 rounded-2xl text-xs font-semibold border transition-all active:scale-95"
            :class="
              timerDraft === min
                ? 'bg-primary text-primary-foreground border-transparent shadow-custom'
                : 'bg-card border-border text-muted-foreground'
            "
          >
            {{
              Math.floor(min / 60) > 0
                ? `${Math.floor(min / 60)}h${min % 60 > 0 ? `${min % 60}m` : ''}`
                : `${min}m`
            }}
          </button>
        </div>
        <button
          @click="handleTimerConfirm"
          class="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all shadow-custom"
        >
          确认设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronLeftIcon,
  WindIcon,
  PowerIcon,
  SunIcon,
  MoonIcon,
  PlusIcon,
  MinusIcon,
  TimerIcon,
  ArrowUpDownIcon,
  GaugeIcon,
  ThermometerIcon,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const router = useRouter()

const COOL_HEAT_MODES = ['制冷', '制热']
const FAN_SPEEDS = ['自动', '低速', '中速', '高速']
const SWING_DIRS = ['关闭', '上下', '左右', '全向']
const TIMER_OPTIONS = [30, 60, 90, 120, 180, 240, 300, 360, 480, 600]

const isOn = ref(true)
const temperature = ref(26)
const modeIdx = ref(0)
const fanIdx = ref(0)
const swingIdx = ref(0)
const sleepOn = ref(false)
const timerMinutes = ref<number | null>(null)
const showTimerSheet = ref(false)
const timerDraft = ref(60)

const modeLabel = computed(() => COOL_HEAT_MODES[modeIdx.value])
const fanLabel = computed(() => FAN_SPEEDS[fanIdx.value])
const swingLabel = computed(() => SWING_DIRS[swingIdx.value])

const timerLabel = computed(() => {
  if (timerMinutes.value === null) return null
  const h = Math.floor(timerMinutes.value / 60)
  const m = timerMinutes.value % 60
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`
})

function handlePower() {
  const next = !isOn.value
  isOn.value = next
  toast.success(`主卧空调已${next ? '开启' : '关闭'}`)
}

function adjustTemp(delta: number) {
  if (!isOn.value) return
  const next = Math.min(30, Math.max(16, temperature.value + delta))
  temperature.value = next
  toast.success(`温度已调至 ${next}°C`)
}

function cycleMode() {
  if (!isOn.value) return
  const next = (modeIdx.value + 1) % COOL_HEAT_MODES.length
  modeIdx.value = next
  toast.success(`已切换为${COOL_HEAT_MODES[next]}模式`)
}

function cycleFan() {
  if (!isOn.value) return
  const next = (fanIdx.value + 1) % FAN_SPEEDS.length
  fanIdx.value = next
  toast.success(`风速已设为${FAN_SPEEDS[next]}`)
}

function cycleSwing() {
  if (!isOn.value) return
  const next = (swingIdx.value + 1) % SWING_DIRS.length
  swingIdx.value = next
  toast.success(`风向已设为${SWING_DIRS[next]}`)
}

function toggleSleep() {
  if (!isOn.value) return
  const next = !sleepOn.value
  sleepOn.value = next
  toast.success(`睡眠模式已${next ? '开启' : '关闭'}`)
}

function handleTimerConfirm() {
  timerMinutes.value = timerDraft.value
  showTimerSheet.value = false
  const h = Math.floor(timerDraft.value / 60)
  const m = timerDraft.value % 60
  const label = h > 0 ? `${h}小时${m > 0 ? `${m}分钟` : ''}` : `${m}分钟`
  toast.success(`定时已设为 ${label}后关机`)
}

function cancelTimer() {
  timerMinutes.value = null
  toast.success('定时已取消')
}
</script>
