<script setup lang="ts">
/**
 * 应用图标（内联 SVG，线性风格）
 * ------------------------------------------------------------
 * 统一以 24x24 viewBox 手写 path，stroke 跟随 currentColor。
 * 用法：<AppIcon name="plus" :size="1.25" />
 * size 单位为 rem（与全局 rem 体系一致）。
 */

/**
 * 单条路径定义。fill=true 时以实心绘制（fill: currentColor、无描边），
 * 用于 more 等需要粗圆点的线性图标。
 */
type IconPath = { d: string; fill?: boolean }
type IconDef = string | IconPath | IconPath[]

const ICONS: Record<string, IconDef> = {
  plus: 'M12 5v14M5 12h14',
  'arrow-left': 'M19 12H5m0 0l6-6m-6 6l6 6',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  trash:
    'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 5v6m4-6v6',
  edit: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z',
  camera:
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  image:
    'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M21 15l-5-5L5 21',
  video: 'M2 6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z M22 8l-5 4 5 4Z',
  play: 'M6 4.5 20 12 6 19.5Z',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Z M12 7v5l3.5 2',
  note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M16 13H8 M16 17H8',
  search:
    'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14Z M21 21l-4.35-4.35',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  'eye-off':
    'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
  // 横排三点：实心圆点，视觉左右留白对称
  more: [
    {
      d: 'M5.5 12m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M12 12m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0M18.5 12m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0',
      fill: true,
    },
  ],
}

import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 图标名（见 ICONS） */
    name: string
    /** 边长，单位 rem（默认 1.25rem = 20px） */
    size?: number
  }>(),
  { size: 1.25 },
)

const iconPaths = computed<IconPath[]>(() => {
  const raw = ICONS[props.name]
  if (raw == null) return []
  if (typeof raw === 'string') return [{ d: raw }]
  return Array.isArray(raw) ? raw : [raw]
})
</script>

<template>
  <svg
    class="app-icon"
    :width="`${size}rem`"
    :height="`${size}rem`"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="(p, i) in iconPaths"
      :key="i"
      :d="p.d"
      :fill="p.fill ? 'currentColor' : 'none'"
      :stroke="p.fill ? 'none' : undefined"
    />
  </svg>
</template>

<style scoped lang="scss">
.app-icon {
  flex: none;
  vertical-align: middle;
}
</style>
