<script setup lang="ts">
/**
 * RoomTabs.vue —— 房间筛选横向滚动标签
 */
defineProps<{
  rooms: string[]
  activeRoom: string
}>()

defineEmits<{
  (e: 'select', room: string): void
}>()
</script>

<template>
  <div
    class="flex gap-2 overflow-x-auto pb-1"
    style="-ms-overflow-style: none; scrollbar-width: none"
  >
    <button
      v-for="room in rooms"
      :key="room"
      class="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
      :class="activeRoom === room
        ? 'bg-primary text-primary-foreground shadow-custom'
        : 'bg-card border border-border text-muted-foreground'"
      @click="$emit('select', room)"
    >{{ room }}</button>
  </div>
</template>
