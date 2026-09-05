<script setup lang="ts">
/**
 * 顶部栏（次级页共用）
 * ------------------------------------------------------------
 *  - 默认显示返回按钮（有历史则回退，否则回首页）
 *  - 中间标题 + 可选副标题
 *  - 右侧通过 #actions 插槽放置操作按钮
 * 吸顶并带磨砂背景，内容滚动时标题保持可见。
 */
import { useRouter } from 'vue-router'

import AppIcon from '@/components/AppIcon.vue'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** 是否显示返回按钮（默认 true） */
    showBack?: boolean
  }>(),
  { title: '', subtitle: '', showBack: true },
)

const router = useRouter()

function goBack(): void {
  // 有上一页则返回，否则回首页（如直接打开详情链接的场景）
  if (window.history.state?.back != null) router.back()
  else router.replace('/')
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <button
        v-if="showBack"
        type="button"
        class="app-header__back"
        aria-label="返回"
        @click="goBack"
      >
        <AppIcon name="arrow-left" :size="1.375" />
      </button>
      <span v-else class="app-header__placeholder" />

      <div class="app-header__titles">
        <h1 v-if="title" class="app-header__title">{{ title }}</h1>
        <p v-if="subtitle" class="app-header__subtitle">{{ subtitle }}</p>
      </div>

      <div class="app-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  padding-top: var(--safe-top, 0rem);
  // 磨砂吸顶背景：先给一层兜底色，再用 color-mix 关联主题色
  background: rgba(246, 241, 233, 0.92);

  @supports (background: color-mix(in srgb, #fff 90%, transparent)) {
    background: color-mix(in srgb, var(--color-paper) 88%, transparent);
  }

  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);

  &__inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    height: 3.375rem;
    padding: 0 1.125rem;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 2.5rem;
    height: 2.5rem;
    margin-left: -0.625rem;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--color-ink-900);
    cursor: pointer;
    transition:
      transform 0.15s ease,
      background-color 0.15s ease;

    &:active {
      transform: scale(0.9);
      background: rgba(74, 46, 30, 0.06);
    }
  }

  &__placeholder {
    flex: none;
    width: 2.5rem;
  }

  // 标题层以视口（吸顶栏）中心为基准绝对居中，
  // 不受左右操作区宽度影响；左右两端按钮由 space-between 撑开
  &__titles {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: auto;
    max-width: calc(100% - 9.5rem);
    overflow: hidden;
    transform: translateX(-50%);
  }

  &__title {
    width: 100%;
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--color-ink-900);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    width: 100%;
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-ink-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: none;
    min-width: 2.5rem;
    margin-right: -0.625rem;
  }
}
</style>
