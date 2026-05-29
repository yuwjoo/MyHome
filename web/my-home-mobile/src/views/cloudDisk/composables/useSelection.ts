import { ref, computed } from 'vue'
import type { FileItem } from '@/types'

export function useSelection(files: () => FileItem[]) {
  const selectedIds = ref<Set<string>>(new Set())

  const isSelecting = computed(() => selectedIds.value.size > 0)
  const allSelected = computed(() => {
    const list = files()
    return list.length > 0 && selectedIds.value.size === list.length
  })

  const selectedFiles = computed(() => {
    const ids = selectedIds.value
    return files().filter((f) => ids.has(f.id))
  })

  function toggleSelect(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function selectAll() {
    selectedIds.value = new Set(files().map((f) => f.id))
  }

  function deselectAll() {
    selectedIds.value = new Set()
  }

  function cancelSelection() {
    selectedIds.value = new Set()
  }

  return {
    selectedIds,
    isSelecting,
    allSelected,
    selectedFiles,
    toggleSelect,
    selectAll,
    deselectAll,
    cancelSelection,
  }
}
