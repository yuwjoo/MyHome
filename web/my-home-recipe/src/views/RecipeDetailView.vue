<script setup lang="ts">
/**
 * 菜谱详情
 * ------------------------------------------------------------
 *  - 顶部：只显示菜谱名称；右侧「⋯」菜单收纳编辑 / 删除
 *  - 照片：双列网格，点击进入全屏灯箱查看原图
 *  - 视频：行内播放器（原生控件）
 *  - 备注：卡片展示
 * 媒体来源：已同步云端的菜谱，图片用公开缩略图直链按需加载
 * （网格 400px / 灯箱 1200px），视频经签名下载接口取播放直链。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { Recipe, RecipeMedia } from '@/types/recipe'
import { useRecipeStore } from '@/stores/recipe'
import { mediaThumbnailUrl, ossApi } from '@/services/api'
import { formatBytes, formatDuration } from '@/utils/format'
import { showToast } from '@/composables/toast'
import AppIcon from '@/components/AppIcon.vue'
import AppHeader from '@/components/AppHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import MediaLightbox from '@/components/MediaLightbox.vue'
import VideoLightbox from '@/components/VideoLightbox.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const store = useRecipeStore()

/** 菜谱数据（加载中为 null） */
const recipe = ref<Recipe | null>(null)

/** 页面是否加载完成（用于骨架屏） */
const ready = ref(false)
/** 菜谱不存在 */
const notFound = ref(false)

/** 视频 refId -> 可播放直链 */
const videoUrls = ref<Record<string, string>>({})

/** 灯箱状态 */
const lightboxOpen = ref(false)
const lightboxStart = ref(0)
/** 视频全屏预览 */
const videoOpen = ref(false)
const videoSrc = ref('')
const videoPoster = ref('')
const videoName = ref('')
/** 删除确认弹窗 */
const deleteOpen = ref(false)

/** 图片媒体列表 */
const images = computed<RecipeMedia[]>(() => {
  const medias = recipe.value?.medias ?? []
  return medias.filter((m) => m.kind === 'image')
})

/** 需要单独渲染的视频列表（已取得播放直链） */
const videoMedias = computed<RecipeMedia[]>(() => {
  const medias = recipe.value?.medias ?? []
  return medias.filter((m) => m.kind === 'video' && m.refId && videoUrls.value[m.refId])
})

/**
 * 图片展示地址：有云端引用则走缩略图接口（图片缩放），
 * 否则回退本地预览缩略图（极端兜底）。
 */
function photoUrl(media: RecipeMedia, width: number): string {
  if (media.refId) return mediaThumbnailUrl(media.refId, width)
  return media.thumbnail ?? ''
}

/** 灯箱：当前可见的图片地址（大图） */
const imageSrcs = computed<string[]>(() =>
  images.value.map((m) => photoUrl(m, 1200)).filter((url): url is string => Boolean(url)),
)

const photoCount = computed(() => images.value.length)
const videoCount = computed(() => recipe.value?.medias.filter((m) => m.kind === 'video').length ?? 0)

/** 顶部栏标题：加载后显示菜谱名，顶部信息只保留名称 */
const headerTitle = computed<string>(() => recipe.value?.name || '菜谱详情')

/** 逐条获取视频播放直链（签名 URL，需登录态；失败的单条不出现在视频区） */
async function loadVideoUrls(recipeItem: Recipe): Promise<void> {
  const map: Record<string, string> = {}
  const videoList = recipeItem.medias.filter((m) => m.kind === 'video' && m.refId)
  await Promise.all(
    videoList.map(async (media) => {
      try {
        map[media.refId as string] = await ossApi.getPublicFilePlayUrl(media.refId as string)
      } catch {
        // 单条失败不影响整体
      }
    }),
  )
  videoUrls.value = map
}

/** 点击照片网格中的某一格：定位到该照片在灯箱中的序号 */
function openLightboxAt(media: RecipeMedia): void {
  const target = images.value.findIndex((m) => m.id === media.id)
  if (target >= 0) {
    lightboxStart.value = target
    lightboxOpen.value = true
  }
}

/** 点击视频卡片 → 全屏播放（直链已在加载阶段取得） */
function playVideo(media: RecipeMedia): void {
  const url = media.refId ? videoUrls.value[media.refId] : ''
  if (!url) return
  videoSrc.value = url
  videoPoster.value = mediaThumbnailUrl(media.refId as string, 720)
  videoName.value = media.name
  videoOpen.value = true
}

function goEdit(): void {
  router.push({ name: 'recipe-edit', params: { id: props.id } })
}

/** ⋯ 更多操作（编辑 / 删除）菜单 */
const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
let onDocClick: ((event: Event) => void) | null = null
let onKeyDown: ((event: KeyboardEvent) => void) | null = null

/** 菜单打开期间：点击外部区域或按 Esc 自动收起 */
watch(menuOpen, async (open) => {
  if (open) {
    await nextTick()
    onDocClick = (event: Event) => {
      if (!menuRoot.value?.contains(event.target as Node)) menuOpen.value = false
    }
    onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') menuOpen.value = false
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return
  }
  if (onDocClick) document.removeEventListener('click', onDocClick)
  if (onKeyDown) document.removeEventListener('keydown', onKeyDown)
  onDocClick = null
  onKeyDown = null
})

onBeforeUnmount(() => {
  if (onDocClick) document.removeEventListener('click', onDocClick)
  if (onKeyDown) document.removeEventListener('keydown', onKeyDown)
})

function onMenuEdit(): void {
  menuOpen.value = false
  goEdit()
}

function onMenuDelete(): void {
  menuOpen.value = false
  deleteOpen.value = true
}

/** 确认删除 */
async function doDelete(): Promise<void> {
  try {
    await store.removeRecipe(props.id)
    showToast('已删除', 'success')
    router.replace('/')
  } catch (error) {
    showToast(error instanceof Error ? error.message : '删除失败，请重试', 'error')
  }
}

onMounted(async () => {
  try {
    // 深链（直接打开详情）时内存可能尚未加载，先确保载入
    if (!store.loaded) await store.fetchAll()
    const item = store.getById(props.id)
    if (!item) {
      notFound.value = true
      return
    }
    recipe.value = item
    await loadVideoUrls(item)
  } catch (error) {
    showToast(error instanceof Error ? error.message : '加载菜谱失败', 'error')
  } finally {
    ready.value = true
  }
})

function goBackHome(): void {
  router.replace('/')
}
</script>

<template>
  <div class="page detail-page">
    <AppHeader :title="headerTitle">
      <template #actions>
        <div v-if="recipe" ref="menuRoot" class="more">
          <button
            type="button"
            class="icon-btn"
            aria-label="更多操作"
            aria-haspopup="menu"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <AppIcon name="more" :size="1.5" />
          </button>
          <div v-if="menuOpen" class="more__pop" role="menu" aria-label="菜谱操作">
            <button type="button" class="more__item" role="menuitem" @click="onMenuEdit">
              <AppIcon name="edit" :size="1" />
              编辑菜谱
            </button>
            <button
              type="button"
              class="more__item more__item--danger"
              role="menuitem"
              @click="onMenuDelete"
            >
              <AppIcon name="trash" :size="1" />
              删除菜谱
            </button>
          </div>
        </div>
      </template>
    </AppHeader>

    <div v-if="ready" class="page-body">
      <!-- 菜谱不存在 -->
      <div v-if="notFound" class="detail-page__not-found empty">
        <h3 class="empty__title">菜谱不存在或已删除</h3>
        <div class="empty__action">
          <button type="button" class="btn btn--primary" @click="goBackHome">
            <span class="btn__icon"><AppIcon name="arrow-left" :size="1.0625" /></span>
            返回首页
          </button>
        </div>
      </div>

      <template v-else-if="recipe">
        <!-- 照片 -->
        <section v-if="photoCount > 0" class="section">
          <h3 class="section__title">照片</h3>
          <div class="detail-page__grid">
            <button
              v-for="media in images"
              :key="media.id"
              type="button"
              class="detail-page__cell"
              :aria-label="`查看照片 ${media.name}`"
              @click="openLightboxAt(media)"
            >
              <img v-if="photoUrl(media, 400)" :src="photoUrl(media, 400)" :alt="media.name" loading="lazy" />
            </button>
          </div>
        </section>

        <!-- 视频 -->
        <section v-if="videoMedias.length > 0" class="section">
          <h3 class="section__title">视频</h3>
          <div class="detail-page__videos">
            <article v-for="media in videoMedias" :key="media.id" class="video-card">
              <button
                type="button"
                class="video-card__poster"
                :aria-label="`播放视频 ${media.name}`"
                @click="playVideo(media)"
              >
                <img
                  :src="mediaThumbnailUrl(media.refId as string, 720)"
                  :alt="media.name"
                  loading="lazy"
                />
                <span class="video-card__play">
                  <AppIcon name="play" :size="1.125" />
                </span>
                <span v-if="media.duration" class="chip video-card__duration">
                  {{ formatDuration(media.duration) }}
                </span>
                <span class="video-card__meta">
                  <span class="video-card__name">{{ media.name }}</span>
                  <span class="video-card__size">{{ formatBytes(media.size) }}</span>
                </span>
              </button>
            </article>
          </div>
        </section>

        <!-- 备注 -->
        <section v-if="recipe.note" class="section">
          <h3 class="section__title">备注</h3>
          <p class="detail-page__note">{{ recipe.note }}</p>
        </section>

        <!-- 空内容引导：既无影像也无备注 -->
        <EmptyState
          v-if="photoCount === 0 && videoCount === 0 && !recipe.note"
          class="detail-page__empty"
          title="这份菜谱还空空的"
          :desc="'补几张照片、录一段视频，\n再写上几句备注，让味道可以被回味'"
        >
          <button type="button" class="btn btn--primary" @click="goEdit">
            <span class="btn__icon"><AppIcon name="edit" :size="1.0625" /></span>
            去完善菜谱
          </button>
        </EmptyState>
      </template>
    </div>

    <!-- 加载骨架 -->
    <div v-else class="page-body detail-page__skeleton">
      <span class="skeleton detail-skeleton__title" />
      <div class="detail-skeleton__grid">
        <span v-for="n in 4" :key="n" class="skeleton" />
      </div>
      <span class="skeleton detail-skeleton__text" />
    </div>

    <!-- 删除确认 -->
    <ConfirmDialog
      v-model:open="deleteOpen"
      title="删除菜谱"
      :message="`确定删除「${recipe?.name ?? ''}」吗？其中的照片与视频也会一并删除，且无法恢复。`"
      confirm-text="删除"
      danger
      @confirm="doDelete"
    />

    <!-- 图片灯箱 -->
    <MediaLightbox v-model:open="lightboxOpen" :srcs="imageSrcs" :start="lightboxStart" />

    <!-- 视频全屏预览 -->
    <VideoLightbox
      v-model:open="videoOpen"
      :src="videoSrc"
      :poster="videoPoster"
      :name="videoName"
    />
  </div>
</template>

<style scoped lang="scss">
.detail-page {
  // 正文与吸顶栏之间留出呼吸空间（原「更新于」行已移除）
  .page-body {
    padding-top: 1rem;
  }

  &__empty {
    padding-top: 4rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.625rem;
  }

  &__cell {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-field);
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:active img {
      transform: scale(1.04);
    }
  }

  &__videos {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__note {
    margin: 0;
    padding: 1.125rem 1.25rem;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
    font-size: 0.9375rem;
    line-height: 1.85;
    color: var(--color-ink-700);
    white-space: pre-wrap;
    word-break: break-word;
  }
}

/* ⋯ 更多操作：浮层菜单（编辑 / 删除） */
.more {
  position: relative;
  display: inline-flex;

  &__pop {
    position: absolute;
    top: calc(100% + 0.375rem);
    right: 0;
    z-index: 60;
    min-width: 9rem;
    padding: 0.3125rem;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.6875rem 0.875rem;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-ink-700);
    font-size: 0.9375rem;
    white-space: nowrap;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:active {
      background: rgba(74, 46, 30, 0.06);
    }

    &--danger {
      color: var(--color-danger);

      &:active {
        background: var(--color-danger-soft);
      }
    }
  }
}

/* 视频卡片（封面 + 播放，点击进入全屏预览） */
.video-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: #000;

  &__poster {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    padding: 0;
    border: none;
    background: #000;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.92;
      transition: transform 0.3s ease;
    }

    &:active img {
      transform: scale(1.03);
    }
  }

  &__play {
    position: absolute;
    top: 50%;
    left: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.875rem;
    height: 2.875rem;
    padding-left: 0.125rem;
    border-radius: 50%;
    background: rgba(20, 12, 6, 0.55);
    color: #fff;
    transform: translate(-50%, -50%);
    backdrop-filter: blur(2px);
    pointer-events: none;
  }

  &__duration {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    pointer-events: none;
  }

  &__meta {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 2rem 0.875rem 0.5rem;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.75rem;
    pointer-events: none;
  }

  &__name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__size {
    flex: none;
    opacity: 0.7;
  }
}

/* 骨架屏 */
.detail-skeleton {
  &__title {
    display: block;
    width: 45%;
    height: 1.875rem;
    margin-bottom: 1rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.625rem;
    margin-bottom: 1.75rem;

    span {
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-md);
    }
  }

  &__text {
    display: block;
    width: 100%;
    height: 6rem;
    border-radius: var(--radius-md);
  }
}
</style>
