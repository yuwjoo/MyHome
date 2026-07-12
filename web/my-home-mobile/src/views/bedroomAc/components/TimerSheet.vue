<template>
  <div v-if="show" class="fixed inset-0 z-50 flex flex-col justify-end">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')" />
    <div
      class="relative bg-background rounded-t-3xl px-5 pt-5 pb-10 shadow-xl max-w-md mx-auto w-full max-h-[85vh] flex flex-col"
    >
      <div class="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5 flex-shrink-0" />
      <div class="text-base font-bold text-foreground mb-1 flex-shrink-0">设置定时</div>
      <div class="text-xs text-muted-foreground mb-4 flex-shrink-0">选择自动关机/开机的时间点</div>

      <div class="overflow-y-auto flex-1 -mx-1 px-1">
        <!-- 定时关机 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-foreground">定时关机</span>
            <div class="flex items-center gap-2">
              <span class="text-xs" v-if="offDraft">
                <span class="text-primary font-medium">{{ offDraft }} 关机</span>
              </span>
              <button
                v-if="offDraft"
                @click="offDraft = ''"
                class="text-[10px] text-muted-foreground border border-border rounded-lg px-2 py-0.5 active:scale-95 transition-all"
              >清除</button>
              <span v-else class="text-xs text-muted-foreground">未设置</span>
            </div>
          </div>
          <div class="grid grid-cols-6 gap-1">
            <button
              v-for="t in TIME_SLOTS"
              :key="'off-' + t"
              @click="offDraft = t"
              class="py-1.5 rounded-lg text-[10px] font-medium border transition-all active:scale-95"
              :class="
                offDraft === t
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-card border-border text-muted-foreground'
              "
            >{{ t }}</button>
          </div>
        </div>

        <!-- 定时开机 -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-foreground">定时开机</span>
            <div class="flex items-center gap-2">
              <span class="text-xs" v-if="onDraft">
                <span class="text-primary font-medium">{{ onDraft }} 开机</span>
              </span>
              <button
                v-if="onDraft"
                @click="onDraft = ''"
                class="text-[10px] text-muted-foreground border border-border rounded-lg px-2 py-0.5 active:scale-95 transition-all"
              >清除</button>
              <span v-else class="text-xs text-muted-foreground">未设置</span>
            </div>
          </div>
          <div class="grid grid-cols-6 gap-1">
            <button
              v-for="t in TIME_SLOTS"
              :key="'on-' + t"
              @click="onDraft = t"
              class="py-1.5 rounded-lg text-[10px] font-medium border transition-all active:scale-95"
              :class="
                onDraft === t
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-card border-border text-muted-foreground'
              "
            >{{ t }}</button>
          </div>
        </div>
      </div>

      <button
        @click="handleConfirm"
        class="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all shadow-custom flex-shrink-0 mt-2"
        :disabled="!hasChanged"
      >
        确认设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { TIME_SLOTS, minutesToTime } from '../constants'

const props = defineProps<{
  show: boolean
  offTimer: number
  onTimer: number
}>()

const emit = defineEmits<{
  close: []
  confirm: [offTime: string, onTime: string]
}>()

const offDraft = ref('')
const onDraft = ref('')

watch(() => props.show, (v) => {
  if (v) {
    offDraft.value = props.offTimer > 0 ? minutesToTime(props.offTimer) : ''
    onDraft.value = props.onTimer > 0 ? minutesToTime(props.onTimer) : ''
  }
})

const hasChanged = computed(() => {
  const currentOff = props.offTimer > 0 ? minutesToTime(props.offTimer) : ''
  const currentOn = props.onTimer > 0 ? minutesToTime(props.onTimer) : ''
  return offDraft.value !== currentOff || onDraft.value !== currentOn
})

function handleConfirm() {
  emit('confirm', offDraft.value, onDraft.value)
}
</script>
