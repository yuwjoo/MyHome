<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="-translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-full opacity-0"
  >
    <div
      v-if="visible"
      data-cmp="SendingIndicator"
      class="fixed top-16 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 backdrop-blur-md shadow-lg border border-border/60 text-xs text-muted-foreground"
      >
        <LoaderCircleIcon :size="13" class="animate-spin text-primary shrink-0" />
        <span>等待设备响应</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { LoaderCircleIcon } from 'lucide-vue-next'

defineProps<{
  visible: boolean
}>()
</script>
