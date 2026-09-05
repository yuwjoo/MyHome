<script setup lang="ts">
/**
 * 首页：菜谱列表
 * ------------------------------------------------------------
 * - 顶部标题区：应用名 + 账号/退出 + 数据总览（照片/视频数）
 * - 主体：卡片列表（按最近更新倒序）/ 加载骨架 / 空状态
 * - 右下角悬浮「新建菜谱」按钮
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { Recipe } from '@/types/recipe'
import { useRecipeStore } from '@/stores/recipe'
import { useAuthStore } from '@/stores/auth'
import { showToast } from '@/composables/toast'
import AppIcon from '@/components/AppIcon.vue'
import PullToRefresh from '@/components/PullToRefresh.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const store = useRecipeStore()
const auth = useAuthStore()

/** 列表：按最近更新倒序 */
const list = computed<Recipe[]>(() => store.sortedRecipes)

/** 菜谱总数（顶部计数徽标） */
const totalCount = computed<number>(() => store.recipes.length)

/** 下拉刷新进行中 */
const refreshing = ref(false)

/** 下拉刷新：强制从云端重新拉取 */
async function onRefresh(): Promise<void> {
  refreshing.value = true
  try {
    await store.fetchAll(true)
  } catch (error) {
    showToast(error instanceof Error ? error.message : '刷新失败，请稍后重试', 'error')
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  try {
    await store.fetchAll()
  } catch (error) {
    showToast(error instanceof Error ? error.message : '加载菜谱失败，请稍后重试', 'error')
  }
})

function openRecipe(recipe: Recipe): void {
  router.push({ name: 'recipe-detail', params: { id: recipe.id } })
}

function goSearch(): void {
  router.push({ name: 'recipe-search' })
}

function goCreate(): void {
  router.push({ name: 'recipe-new' })
}
</script>

<template>
  <div class="page list-page">
    <PullToRefresh :loading="refreshing" @refresh="onRefresh">
    <!-- 顶部标题区：标题行 + 搜索入口（信息精简、紧凑） -->
    <header class="list-page__header">
      <div class="list-page__bar">
        <h1 class="list-page__title">
          我的菜谱
          <span v-if="totalCount > 0" class="list-page__count">{{ totalCount }} 道</span>
        </h1>
        <div class="list-page__account" :title="auth.user?.userAccount">
          <span class="list-page__account-name">{{ auth.displayName }}</span>
          <button type="button" class="list-page__logout" @click="auth.logout">退出</button>
        </div>
      </div>

      <!-- 模糊搜索入口：点击进入独立搜索页 -->
      <button
        type="button"
        class="list-page__search"
        aria-label="搜索菜谱"
        @click="goSearch"
      >
        <AppIcon name="search" :size="1.125" />
        <span class="list-page__search-ph">搜索菜谱名或备注…</span>
      </button>
    </header>

    <div class="page-body list-page__body">
      <!-- 首次加载骨架屏 -->
      <template v-if="store.loading && !store.loaded">
        <div v-for="n in 3" :key="n" class="card-skeleton">
          <span class="card-skeleton__cover skeleton" />
          <span class="card-skeleton__line skeleton" />
          <span class="card-skeleton__line card-skeleton__line--short skeleton" />
        </div>
      </template>

      <!-- 列表 -->
      <template v-else-if="list.length > 0">
        <RecipeCard
          v-for="recipe in list"
          :key="recipe.id"
          class="list-page__item"
          :recipe="recipe"
          @open="openRecipe"
        />
      </template>

      <!-- 空状态 -->
      <EmptyState
        v-else
        class="list-page__empty"
        title="还没有菜谱"
        :desc="'记录第一道拿手菜吧——\n拍照、录像，再写上几句备注'"
      >
        <button type="button" class="btn btn--primary" @click="goCreate">
          <span class="btn__icon"><AppIcon name="plus" :size="1.0625" /></span>
          新建菜谱
        </button>
      </EmptyState>
    </div>
    </PullToRefresh>

    <!-- 悬浮新建按钮 -->
    <button type="button" class="fab list-page__fab" aria-label="新建菜谱" @click="goCreate">
      <AppIcon name="plus" :size="1.375" />
      <span>新建菜谱</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.list-page {
  &__header {
    padding: calc(var(--safe-top, 0rem) + 1.375rem) 1.25rem 0;
  }

  // 标题行：左侧标题 + 计数，右侧账号信息
  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 0.5625rem;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    color: var(--color-ink-900);
    line-height: 1.25;
  }

  // 菜谱总数：轻量小徽标，替代原先的概要长句
  &__count {
    display: inline-flex;
    align-items: center;
    padding: 0.1875rem 0.625rem;
    border-radius: var(--radius-full);
    background: var(--color-brand-100);
    color: var(--color-brand-700);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
  }

  &__account {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 58%;
  }

  &__account-name {
    overflow: hidden;
    font-size: 0.75rem;
    color: var(--color-ink-500);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__logout {
    flex: none;
    padding: 0.25rem 0.625rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-ink-500);
    font-size: 0.6875rem;
    cursor: pointer;
    transition:
      color 0.15s ease,
      border-color 0.15s ease;

    &:active {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }
  }

  // 搜索入口：整行模拟一个搜索框，是页面最高频操作，保持突出
  &__search {
    display: flex;
    align-items: center;
    gap: 0.5625rem;
    width: 100%;
    height: 3rem;
    margin-bottom: 0.25rem;
    padding: 0 1.125rem;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
    color: var(--color-ink-300);
    font-size: 0.9375rem;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      box-shadow 0.15s ease;

    .app-icon {
      color: var(--color-brand-400);
    }

    &:hover {
      box-shadow: var(--shadow-card), 0 0 0 1px var(--color-brand-200);
    }

    &:active {
      transform: scale(0.985);
      box-shadow: 0 0 0 2px var(--color-brand-200);
    }
  }

  &__search-ph {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__body {
    padding-top: 1.125rem;
    padding-bottom: calc(7rem + var(--safe-bottom, 0rem));
  }

  &__item {
    margin-bottom: 1.125rem;
  }

  &__empty {
    padding-top: 5rem;
  }
}
</style>

<style scoped lang="scss">
.card-skeleton {
  display: grid;
  grid-template-columns: 8.5rem 1fr;
  grid-template-rows: 1fr;
  column-gap: 0.9375rem;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 1.125rem;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);

  &__cover {
    grid-row: 1;
    height: 6.375rem;
    border-radius: var(--radius-sm);
  }

  &__line {
    grid-column: 2;
    height: 1rem;
    margin-bottom: 0.75rem;
    border-radius: var(--radius-full);

    &--short {
      width: 65%;
    }
  }
}
</style>
