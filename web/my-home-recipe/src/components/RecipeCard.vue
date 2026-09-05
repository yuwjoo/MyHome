<script setup lang="ts">
/**
 * 菜谱卡片（列表项）
 * ------------------------------------------------------------
 * 横向布局：左侧封面缩略图（4:3）、右侧名称/备注/时间与媒体数。
 * 封面直接使用保存时生成的 dataURL 缩略图，无需读取原文件，
 * 保证列表滚动流畅。
 */
import { computed } from 'vue'

import type { Recipe } from '@/types/recipe'
import { formatFriendlyTime } from '@/utils/format'
import { splitHighlight } from '@/utils/highlight'
import { mediaThumbnailUrl } from '@/services/api'
import AppIcon from '@/components/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    recipe: Recipe
    /** 高亮关键词（如搜索页传入，命中文字会以 <mark> 呈现） */
    highlight?: string
  }>(),
  { highlight: '' },
)

const emit = defineEmits<{
  (e: 'open', recipe: Recipe): void
}>()

/**
 * 封面：优先用本地预览缩略图（编辑器新增），
 * 否则以首个媒体 refId 走服务端缩略图接口（图片缩放/视频截帧）
 */
const coverThumb = computed<string>(() => {
  const withLocal = props.recipe.medias.find((m) => m.thumbnail)
  if (withLocal) return withLocal.thumbnail ?? ''
  const first = props.recipe.medias[0]
  return first?.refId ? mediaThumbnailUrl(first.refId, 400) : ''
})

/** 是否有媒体可展示 */
const hasMedia = computed<boolean>(() => props.recipe.medias.length > 0)

/** 媒体数量摘要，如「3 张照片 · 2 段视频」 */
const mediaSummary = computed<string>(() => {
  const images = props.recipe.medias.filter((m) => m.kind === 'image').length
  const videos = props.recipe.medias.filter((m) => m.kind === 'video').length
  const parts: string[] = []
  if (images > 0) parts.push(`${images} 张照片`)
  if (videos > 0) parts.push(`${videos} 段视频`)
  return parts.join(' · ')
})

/** 友好时间文案（最近更新） */
const timeText = computed<string>(() => formatFriendlyTime(props.recipe.updatedAt))

/** 高亮关键词（已去除首尾空白） */
const keyword = computed<string>(() => props.highlight.trim())

/** 菜谱名 / 备注的高亮片段（搜索页命中词用 <mark> 呈现） */
const nameParts = computed(() => splitHighlight(props.recipe.name, keyword.value))
const noteParts = computed(() =>
  props.recipe.note ? splitHighlight(props.recipe.note, keyword.value) : [],
)
</script>

<template>
  <article
    class="recipe-card"
    role="button"
    tabindex="0"
    @click="emit('open', recipe)"
    @keydown.enter="emit('open', recipe)"
  >
    <!-- 封面 -->
    <div class="recipe-card__cover">
      <img v-if="coverThumb" :src="coverThumb" alt="" loading="lazy" />
      <div v-else class="recipe-card__cover-placeholder">
        <AppIcon name="image" :size="1.875" />
      </div>
      <span v-if="!hasMedia" class="recipe-card__empty-tag">暂无影像</span>
    </div>

    <!-- 内容 -->
    <div class="recipe-card__body">
      <h3 class="recipe-card__name">
        <template v-for="(part, index) in nameParts" :key="index">
          <mark v-if="part.hit" class="recipe-card__hit">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </h3>
      <p v-if="recipe.note" class="recipe-card__note">
        <template v-for="(part, index) in noteParts" :key="index">
          <mark v-if="part.hit" class="recipe-card__hit">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>

      <div class="recipe-card__footer">
        <span class="recipe-card__time">
          <AppIcon name="clock" :size="0.9375" />
          {{ timeText }}
        </span>
        <span v-if="mediaSummary" class="recipe-card__summary">
          <span class="recipe-card__summary-text">{{ mediaSummary }}</span>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '../styles/mixins' as *;

.recipe-card {
  display: flex;
  gap: 0.9375rem;
  padding: 0.75rem;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  @include pressable;

  &__cover {
    position: relative;
    flex: none;
    width: 8.5rem;
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--color-field);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--color-ink-300);
    background: linear-gradient(150deg, var(--color-brand-50), var(--color-field));
  }

  &__empty-tag {
    position: absolute;
    right: 0.4375rem;
    bottom: 0.4375rem;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-full);
    background: rgba(24, 16, 8, 0.55);
    color: #fff;
    font-size: 0.6875rem;
    line-height: 1.5;
    backdrop-filter: blur(2px);
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    padding: 0.25rem 0.25rem 0.125rem 0;
  }

  &__name {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--color-ink-900);
    line-height: 1.4;
    @include text-ellipsis;
  }

  &__hit {
    padding: 0 0.0625rem;
    border-radius: 0.1875rem;
    background: var(--color-brand-100);
    color: var(--color-brand-700);
    font-style: normal;
  }

  &__note {
    margin: 0.3125rem 0 0;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--color-ink-500);
    @include text-clamp(2);
  }

  &__footer {
    display: flex;
    flex-wrap: wrap; // 底部信息空间不足时换行，绝不横向溢出
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem 0.625rem;
    margin-top: auto;
    padding-top: 0.6875rem;
  }

  &__time {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-ink-300);
    white-space: nowrap;
  }

  &__summary {
    display: inline-flex;
    min-width: 0; // 允许收缩，超长内容由内部文本省略
    font-size: 0.75rem;
    color: var(--color-ink-300);

    &-text {
      @include text-ellipsis;
    }
  }
}
</style>
