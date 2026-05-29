<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { PencilIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { renameFile } from '../data'

/**
 * 重命名弹窗
 * path: 要重命名的文件路径
 * initialName: 当前文件名
 */
const props = defineProps<{
  visible: boolean
  initialName: string
  /** 文件路径（用于 API 调用） */
  path?: string
}>()

const emit = defineEmits<{
  confirm: [newName: string]
  cancel: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const renaming = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    inputValue.value = props.initialName
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
})

async function handleConfirm() {
  const newName = inputValue.value.trim()
  if (!newName || renaming.value) return
  renaming.value = true
  try {
    if (props.path) {
      await renameFile(props.path, newName)
    }
    toast.success(`已重命名为：${newName}`)
    emit('confirm', newName)
  } catch {
    // 错误已在拦截器中通过 toast 提示
    toast.error(`重命名失败`)
  } finally {
    renaming.value = false
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[60] flex items-center justify-center px-8"
    @click="emit('cancel')"
  >
    <div class="absolute inset-0 bg-foreground/40" />
    <div
      class="relative bg-card rounded-3xl shadow-custom border border-border w-full max-w-xs p-6 flex flex-col items-center"
      @click.stop
    >
      <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <PencilIcon :size="24" class="text-primary" :stroke-width="1.8" />
      </div>
      <div class="text-base font-bold text-foreground mb-5">重命名</div>
      <input
        ref="inputRef"
        v-model="inputValue"
        class="w-full h-11 px-4 rounded-2xl bg-muted border border-border text-sm text-foreground font-medium focus:outline-none focus:border-primary transition-colors mb-5"
        @keydown.enter="handleConfirm"
      />
      <div class="flex gap-3 w-full">
        <button
          @click="emit('cancel')"
          class="flex-1 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm active:opacity-80 transition-opacity border border-border"
        >
          取消
        </button>
        <button
          @click="handleConfirm"
          class="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:opacity-80 transition-opacity shadow-custom"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>
