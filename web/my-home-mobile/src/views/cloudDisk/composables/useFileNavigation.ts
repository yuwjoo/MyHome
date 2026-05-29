import { ref, computed } from 'vue'
import type { BreadcrumbItem } from '@/types'

export function useFileNavigation() {
  const pathStack = ref<BreadcrumbItem[]>([{ label: '全部文件', path: '/' }])

  const currentPath = computed(() => pathStack.value[pathStack.value.length - 1]!.path)
  const isAtRoot = computed(() => pathStack.value.length === 1)

  function navigateToFolder(label: string, path: string) {
    pathStack.value = [...pathStack.value, { label, path }]
  }

  function navigateBreadcrumb(path: string) {
    const idx = pathStack.value.findIndex((b) => b.path === path)
    if (idx >= 0) pathStack.value = pathStack.value.slice(0, idx + 1)
  }

  function resetNavigation() {
    pathStack.value = [{ label: '全部文件', path: '/' }]
  }

  return {
    pathStack,
    currentPath,
    isAtRoot,
    navigateToFolder,
    navigateBreadcrumb,
    resetNavigation,
  }
}
