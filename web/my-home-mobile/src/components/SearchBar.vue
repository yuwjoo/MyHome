<script setup lang="ts">
import { SearchIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  placeholder?: string
}>(), {
  placeholder: '搜索文件名...',
})

const router = useRouter()
</script>

<template>
  <button
    data-cmp="SearchBar"
    @click="router.push('/search')"
    class="flex-1 flex items-center gap-2.5 h-10 px-4 rounded-2xl bg-muted border border-border active:border-primary/40 transition-colors text-left"
  >
    <SearchIcon :size="15" class="text-muted-foreground flex-shrink-0" :stroke-width="2.5" />
    <span class="text-sm text-muted-foreground">{{ placeholder }}</span>
  </button>
</template>
