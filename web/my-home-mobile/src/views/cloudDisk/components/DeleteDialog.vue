<script setup lang="ts">
import { ref } from 'vue'
import { Trash2Icon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { deleteFile } from '../data'

/**
 * 删除确认弹窗
 * path: 要删除的文件路径（单个）
 * paths: 要删除的多个文件路径（批量）
 */
const props = defineProps<{
  visible: boolean
  /** 被删除对象的名称描述（如 "文件名" 或 "3 个文件"） */
  label: string
  /** 单个文件路径 */
  path?: string
  /** 多个文件路径（批量删除） */
  paths?: string[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const deleting = ref(false)

async function handleConfirm() {
  if (deleting.value) return
  deleting.value = true
  try {
    // 批量删除
    if (props.paths && props.paths.length > 0) {
      await Promise.all(props.paths.map((p) => deleteFile(p)))
      toast.success(`已删除 ${props.paths.length} 个文件`)
    } else if (props.path) {
      // 单个删除
      await deleteFile(props.path)
      toast.success(`已删除：${props.label}`)
    }
    emit('confirm')
  } catch {
    // 错误已在拦截器中通过 toast 提示
    toast.error(`删除失败：${props.label}`)
  } finally {
    deleting.value = false
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
      <div class="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <Trash2Icon :size="26" class="text-destructive" :stroke-width="1.8" />
      </div>
      <div class="text-base font-bold text-foreground mb-2">确认删除</div>
      <div class="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
        确定要删除
        <span class="font-semibold text-foreground break-all">{{ label }}</span>
        吗？此操作不可撤销。
      </div>
      <div class="flex gap-3 w-full">
        <button
          @click="emit('cancel')"
          class="flex-1 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm active:opacity-80 transition-opacity border border-border"
        >
          取消
        </button>
        <button
          @click="handleConfirm"
          class="flex-1 py-3 rounded-2xl bg-destructive text-white font-semibold text-sm active:opacity-80 transition-opacity shadow-custom"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>
