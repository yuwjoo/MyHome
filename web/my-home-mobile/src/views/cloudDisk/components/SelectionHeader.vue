<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { XIcon, CheckSquareIcon, SquareIcon } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  visible?: boolean
  selectedCount?: number
  totalCount?: number
  allSelected?: boolean
}>(), {
  visible: false,
  selectedCount: 0,
  totalCount: 0,
  allSelected: false,
})

const emit = defineEmits<{
  cancel: []
  selectAll: []
  deselectAll: []
}>()

const animClass = ref('')
const rendered = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

watch(() => props.visible, (val) => {
  if (val) {
    rendered.value = true
    nextTick(() => { animClass.value = 'action-header-enter' })
  } else {
    animClass.value = 'action-header-leave'
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { rendered.value = false }, 240)
  }
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div
    data-cmp="SelectionHeader"
    class="fixed top-0 left-0 right-0 z-30 bg-primary"
    :class="rendered ? animClass : 'opacity-0 pointer-events-none'"
    style="box-shadow: 0 4px 24px rgba(91,93,232,0.22)"
  >
    <div class="h-safe-top bg-primary" />
    <div class="flex items-center justify-between px-5 h-14">
      <button
        @click="emit('cancel')"
        class="flex items-center gap-1.5 text-primary-foreground/90 active:text-primary-foreground transition-colors"
      >
        <XIcon :size="18" :stroke-width="2.5" />
        <span class="text-sm font-medium">取消</span>
      </button>
      <span class="text-sm font-bold text-primary-foreground">
        已选 {{ selectedCount }} 项
      </span>
      <button
        @click="allSelected ? emit('deselectAll') : emit('selectAll')"
        class="flex items-center gap-1.5 text-primary-foreground/90 active:text-primary-foreground transition-colors"
      >
        <CheckSquareIcon v-if="allSelected" :size="18" :stroke-width="2" />
        <SquareIcon v-else :size="18" :stroke-width="2" />
        <span class="text-sm font-medium">{{ allSelected ? '取消全选' : '全选' }}</span>
      </button>
    </div>
  </div>
</template>
