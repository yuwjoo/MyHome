<script setup lang="ts">
/**
 * 模糊搜索页（独立路由 /search）
 * ------------------------------------------------------------
 * 交互设计：
 *  - 首页搜索入口进入，输入框自动聚焦；
 *  - 关键词防抖 300ms 自动搜索（服务端按 菜谱名/备注 LIKE 模糊匹配）；
 *  - 关键词同步到 URL query（?q=），从详情返回 / 刷新页面可恢复结果；
 *  - 结果复用 RecipeCard，命中文字高亮显示，点击进入详情；
 *  - 覆盖 引导态 / 加载骨架 / 结果列表 / 无结果空态 四种状态。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Recipe } from '@/types/recipe'
import { toUiRecipe } from '@/stores/recipe'
import { recipeApi } from '@/services/api'
import { showToast } from '@/composables/toast'
import AppIcon from '@/components/AppIcon.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const route = useRoute()

/** 单页拉取上限：家庭场景一次拉全搜索结果足够 */
const PAGE_SIZE = 100

type SearchState = 'idle' | 'loading' | 'done'

/** 初始关键词：优先恢复 URL query（从详情返回或深链分享场景） */
const keyword = ref<string>(
  typeof route.query.q === 'string' ? route.query.q : '',
)
const state = ref<SearchState>('idle')
const results = ref<Recipe[]>([])
const total = ref(0)

const inputEl = ref<HTMLInputElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
/** 请求序号：保证「后发请求」不被「先前返回」覆盖 */
let requestSeq = 0

/** 去除首尾空白后的关键词（同时作为卡片高亮词） */
const trimmed = computed<string>(() => keyword.value.trim())

/** 是否展示结果计数条 */
const showMeta = computed(
  () => state.value === 'done' && results.value.length > 0,
)

function cancelPending(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

/** 立即发起一次搜索（防抖与回车共用） */
async function runSearch(): Promise<void> {
  cancelPending()
  const kw = trimmed.value
  if (!kw) {
    requestSeq += 1
    state.value = 'idle'
    results.value = []
    total.value = 0
    return
  }

  const seq = ++requestSeq
  state.value = 'loading'
  try {
    const page = await recipeApi.list({
      pageNum: 1,
      pageSize: PAGE_SIZE,
      keywords: kw,
    })
    if (seq !== requestSeq) return
    results.value = page.records.map(toUiRecipe)
    total.value = page.total
    state.value = 'done'
  } catch (error) {
    if (seq !== requestSeq) return
    // 失败不卡在骨架：回到引导态并提示
    results.value = []
    total.value = 0
    state.value = 'idle'
    showToast(error instanceof Error ? error.message : '搜索失败，请稍后重试', 'error')
  }
}

/** 关键词变化：同步 URL 并防抖触发搜索 */
function scheduleSearch(): void {
  cancelPending()
  const q = trimmed.value
  // 用 replace 同步 query：不新增历史记录，避免破坏返回栈
  void router.replace({ query: q ? { q } : {} })

  if (!q) {
    requestSeq += 1
    state.value = 'idle'
    results.value = []
    total.value = 0
    return
  }
  debounceTimer = setTimeout(() => {
    void runSearch()
  }, 300)
}

function clearKeyword(): void {
  keyword.value = ''
  // 清空后让输入框重新聚焦，方便直接输入新词
  void nextTick().then(() => inputEl.value?.focus())
}

/** 从「无结果」空态直接返回全部菜谱（列表页） */
function backToList(): void {
  router.replace('/')
}

function goBack(): void {
  // 有上一页则返回，否则回首页（如直接打开搜索链接的场景）
  if (window.history.state?.back != null) router.back()
  else router.replace('/')
}

function openRecipe(recipe: Recipe): void {
  router.push({ name: 'recipe-detail', params: { id: recipe.id } })
}

watch(keyword, scheduleSearch)

onMounted(async () => {
  await nextTick()
  inputEl.value?.focus()
  // URL 已带关键词（返回/深链）：直接恢复搜索结果
  if (trimmed.value) void runSearch()
})

onBeforeUnmount(cancelPending)
</script>

<template>
  <div class="page search-page">
    <!-- 顶栏：返回 + 搜索框 -->
    <header class="search-page__header">
      <button
        type="button"
        class="search-page__back"
        aria-label="返回"
        @click="goBack"
      >
        <AppIcon name="arrow-left" :size="1.375" />
      </button>

      <div class="search-page__bar">
        <AppIcon name="search" :size="1.125" />
        <input
          ref="inputEl"
          v-model="keyword"
          class="search-page__input"
          type="text"
          placeholder="搜索菜谱名或备注…"
          enterkeyhint="search"
          maxlength="50"
          @keyup.enter="runSearch"
        />
        <button
          v-if="keyword"
          type="button"
          class="search-page__clear"
          aria-label="清空关键词"
          @click="clearKeyword"
        >
          <AppIcon name="close" :size="1" />
        </button>
      </div>
    </header>

    <div class="page-body search-page__body">
      <!-- 结果计数 -->
      <p v-if="showMeta" class="search-page__meta">
        <span class="search-page__meta-total">找到 {{ total }} 道菜谱</span>
        <template v-if="trimmed">
          <span class="search-page__meta-dot" aria-hidden="true" />
          <span class="search-page__meta-key">匹配「{{ trimmed }}」</span>
        </template>
      </p>

      <!-- 加载骨架 -->
      <template v-if="state === 'loading'">
        <div v-for="n in 3" :key="n" class="card-skeleton">
          <span class="card-skeleton__cover skeleton" />
          <span class="card-skeleton__lines">
            <span class="card-skeleton__line skeleton" />
            <span class="card-skeleton__line card-skeleton__line--short skeleton" />
          </span>
        </div>
      </template>

      <!-- 搜索结果 -->
      <template v-else-if="results.length > 0">
        <RecipeCard
          v-for="recipe in results"
          :key="recipe.id"
          class="search-page__item"
          :recipe="recipe"
          :highlight="trimmed"
          @open="openRecipe"
        />
      </template>

      <!-- 无结果空态 -->
      <EmptyState
        v-else-if="trimmed"
        class="search-page__empty"
        :title="`没有找到「${trimmed}」相关的菜谱`"
        desc="换个关键词再试试，比如菜名、食材，或某道菜的做法"
      >
        <div class="search-page__actions">
          <button type="button" class="btn btn--soft" @click="clearKeyword">
            换个关键词
          </button>
          <button type="button" class="btn btn--primary" @click="backToList">
            返回全部菜谱
          </button>
        </div>
      </EmptyState>

      <!-- 引导空态 -->
      <EmptyState
        v-else
        class="search-page__empty"
        title="搜搜你的拿手菜"
        :desc="'输入菜谱名或备注即可模糊查找，\n例如：红烧、排骨、周末的汤'"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-page {
  &__header {
    position: sticky; // 滚动结果时搜索栏保持可见，便于随时改词
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: calc(var(--safe-top, 0rem) + 0.5rem) 0.75rem 0.625rem;
    background: rgba(246, 241, 233, 0.92);
    border-bottom: 1px solid rgba(74, 46, 30, 0.05);
    backdrop-filter: blur(0.75rem);
    -webkit-backdrop-filter: blur(0.75rem);

    @supports (background: color-mix(in srgb, #fff 90%, transparent)) {
      background: color-mix(in srgb, var(--color-paper) 88%, transparent);
    }
  }

  &__back {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
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

  &__bar {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.5rem;
    height: 2.875rem;
    padding: 0 0.875rem;
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
    color: var(--color-ink-300);
    transition: box-shadow 0.15s ease;

    > .app-icon:first-child {
      flex: none;
      color: var(--color-brand-400);
    }

    &:focus-within {
      box-shadow: 0 0 0 2px var(--color-brand-300);
    }
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-ink-900);
    font-size: 1rem; // >=16px，避免 iOS 聚焦自动放大
    line-height: 1.4;

    &::placeholder {
      color: var(--color-ink-300);
    }
  }

  &__clear {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 1.375rem;
    height: 1.375rem;
    border: none;
    border-radius: 50%;
    background: var(--color-ink-300);
    color: #fff;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:active {
      background: var(--color-ink-500);
    }
  }

  &__body {
    padding-top: 0.875rem;
    padding-bottom: calc(2.5rem + var(--safe-bottom, 0rem));
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.875rem;
    font-size: 0.8125rem;
  }

  &__meta-total {
    font-weight: 600;
    color: var(--color-ink-700);
  }

  &__meta-dot {
    flex: none;
    width: 0.1875rem;
    height: 0.1875rem;
    border-radius: 50%;
    background: var(--color-ink-300);
  }

  &__meta-key {
    overflow: hidden;
    color: var(--color-ink-500);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__item {
    margin-bottom: 1.125rem;
  }

  &__empty {
    padding-top: 3.5rem;
  }

  // 无结果空态动作区：两个按钮并排
  &__actions {
    display: flex;
    gap: 0.75rem;
  }
}

/* 搜索结果加载骨架 */
.card-skeleton {
  display: flex;
  gap: 0.9375rem;
  padding: 0.75rem;
  margin-bottom: 1.125rem;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);

  &__cover {
    flex: none;
    width: 8.5rem;
    height: 6.375rem;
    border-radius: var(--radius-sm);
  }

  &__lines {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 0.75rem;
  }

  &__line {
    display: block;
    height: 1rem;
    border-radius: var(--radius-full);

    &--short {
      width: 65%;
    }
  }
}
</style>
