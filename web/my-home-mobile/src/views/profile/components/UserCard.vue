<script setup lang="ts">
/**
 * UserCard.vue —— 用户头像 & 基本信息卡片
 */
import { computed } from 'vue'
import { EditIcon } from 'lucide-vue-next'
import { API_BASE_URL } from '@/utils/config'
import type { UserInfo } from '@/types'

const props = defineProps<{
  user: UserInfo
}>()

defineEmits<{
  (e: 'editName'): void
  (e: 'viewDetail'): void
}>()

/** 用户头像缩略图 URL */
const avatarUrl = computed(() => {
  const refId = props.user.avatar
  if (!refId) return ''
  return `${API_BASE_URL}/oss/getPublicFileThumbnail?ossObjectRefId=${encodeURIComponent(refId)}&imageWidth=128`
})
</script>

<template>
  <button
    class="w-full text-left px-5 pt-10 pb-4 active:opacity-70 transition-opacity"
    @click="$emit('viewDetail')"
  >
    <div class="flex items-center gap-4">
      <!-- 用户头像 -->
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        class="w-16 h-16 rounded-2xl object-cover flex-shrink-0 shadow-custom"
        alt="avatar"
      />
      <div
        v-else
        class="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-custom"
      >
        <span class="text-2xl font-bold text-primary">{{ user.name.slice(0, 1) }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-foreground text-lg font-bold leading-tight">{{ user.name }}</span>
          <button
            class="w-6 h-6 rounded-lg bg-muted flex items-center justify-center active:scale-90 transition-transform"
            @click.stop="$emit('editName')"
          >
            <EditIcon :size="12" class="text-muted-foreground" :stroke-width="2.5" />
          </button>
        </div>
        <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          {{ user.level }}
        </div>
      </div>
    </div>
  </button>
</template>
