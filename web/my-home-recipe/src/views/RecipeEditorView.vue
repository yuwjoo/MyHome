<script setup lang="ts">
/**
 * 新建 / 编辑菜谱（/recipe/new 与 /recipe/:id/edit 共用）
 * ------------------------------------------------------------
 *  - 菜谱名称：必填，带字数上限与计数
 *  - 影像：支持「拍照 / 录像 / 从相册选择」，选择后立刻生成本地
 *    预览缩略图；保存时新媒体直传 OSS，云端媒体仅保存元信息 +
 *    refId（已上传媒体在编辑器中经服务端缩略图接口回显）
 *  - 备注：可选，多行文本
 *  - 保存：新建或更新；被移除的旧媒体由服务端自动释放引用
 *  - 防呆：存在未保存修改时，离开页面需二次确认
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import type { MediaInput, Recipe, RecipeMedia } from '@/types/recipe'
import { useRecipeStore } from '@/stores/recipe'
import { mediaThumbnailUrl, ossApi } from '@/services/api'
import { processMediaFile } from '@/utils/media'
import { formatDuration, newId } from '@/utils/format'
import { showToast } from '@/composables/toast'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import MediaLightbox from '@/components/MediaLightbox.vue'
import VideoLightbox from '@/components/VideoLightbox.vue'

const route = useRoute()
const router = useRouter()
const store = useRecipeStore()

/** 正在编辑的菜谱 id（新建页为空） */
const recipeId = computed<string | undefined>(() =>
  typeof route.params.id === 'string' ? route.params.id : undefined,
)
const isEdit = computed<boolean>(() => Boolean(recipeId.value))

/* ---------------- 表单状态 ---------------- */
const name = ref('')
const note = ref('')
/** 媒体列表：meta 描述 + blob（新增项有值；保留的旧项为 null） */
const medias = ref<MediaInput[]>([])

const nameInput = ref<HTMLInputElement | null>(null)
/** 是否正在读取/处理媒体文件 */
const processing = ref(false)
/** 是否正在保存 */
const saving = ref(false)
/** 编辑模式下是否已加载完成（避免表单短暂空白/闪烁） */
const loaded = ref(false)

/** 页面加载起始快照，用于“未保存修改”判定 */
const initialSnapshot = ref('')

function buildSnapshot(): string {
  return JSON.stringify({
    name: name.value,
    note: note.value,
    ids: medias.value.map((m) => m.meta.id),
  })
}

const isDirty = computed<boolean>(() => initialSnapshot.value !== buildSnapshot())

const nameChars = computed(() => name.value.length)
const noteChars = computed(() => note.value.length)

const photoCount = computed(() => medias.value.filter((m) => m.meta.kind === 'image').length)
const videoCount = computed(() => medias.value.filter((m) => m.meta.kind === 'video').length)
const mediaSummary = computed(() => {
  const parts: string[] = []
  if (photoCount.value > 0) parts.push(`${photoCount.value} 张照片`)
  if (videoCount.value > 0) parts.push(`${videoCount.value} 段视频`)
  return parts.join(' · ')
})

/* ---------------- 编辑态：加载已有菜谱 ---------------- */
onMounted(async () => {
  if (!isEdit.value) {
    loaded.value = true
    initialSnapshot.value = buildSnapshot()
    return
  }

  try {
    // 深链进入时内存可能尚未加载，先确保载入
    if (!store.loaded) await store.fetchAll()
    const item = recipeId.value ? store.getById(recipeId.value) : undefined
    if (!item) {
      showToast('菜谱不存在或已被删除', 'error')
      router.replace('/')
      return
    }
    name.value = item.name
    note.value = item.note
    medias.value = item.medias.map((meta) => ({ meta, blob: null }))
    initialSnapshot.value = buildSnapshot()
  } catch {
    showToast('加载菜谱失败', 'error')
    router.replace('/')
    return
  } finally {
    loaded.value = true
  }
})

/* ---------------- 媒体导入 ---------------- */
const photoInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const albumInput = ref<HTMLInputElement | null>(null)

/** 触发对应来源的文件选择 */
function pickVia(source: 'photo' | 'video' | 'album'): void {
  const el =
    source === 'photo' ? photoInput.value : source === 'video' ? videoInput.value : albumInput.value
  el?.click()
}

/** 文件选择完成 */
async function onFilesChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // 允许下次再次选择同一文件
  if (files.length > 0) await addFiles(files)
}

/** 拖拽导入（桌面调试/使用更顺手） */
async function onDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length > 0) await addFiles(files)
}

function onDragOver(event: DragEvent): void {
  event.preventDefault()
}

/**
 * 逐个处理文件：识别类型 → 提取宽高/时长 → 生成缩略图。
 * 处理过程逐文件 await，处理量小，简单可靠。
 */
async function addFiles(files: File[]): Promise<void> {
  if (processing.value) return
  processing.value = true
  let added = 0
  let skipped = 0

  for (const file of files) {
    const processed = await processMediaFile(file)
    if (!processed) {
      skipped += 1
      continue
    }
    const meta: RecipeMedia = {
      id: newId(),
      kind: processed.kind,
      name: processed.name,
      mimeType: processed.mimeType,
      size: processed.size,
      width: processed.width,
      height: processed.height,
      duration: processed.duration,
      thumbnail: processed.thumbnail,
    }
    medias.value.push({ meta, blob: processed.blob })
    added += 1
  }

  processing.value = false
  if (added > 0 && skipped === 0) showToast(`已添加 ${added} 个文件`, 'success')
  else if (added > 0 && skipped > 0) showToast(`已添加 ${added} 个，${skipped} 个不支持已跳过`, 'info')
  else if (skipped > 0) showToast('暂不支持这类文件', 'error')
}

/** 移除某个媒体（仅从待保存列表移除） */
function removeMedia(index: number): void {
  medias.value.splice(index, 1)
}

/**
 * 媒体展示地址：
 *  - 新增未保存的文件用本地预览缩略图（thumbnail）
 *  - 已上传媒体按 refId 走服务端缩略图接口（图片缩放 / 视频截帧）
 */
function mediaTileSrc(meta: RecipeMedia): string {
  if (meta.thumbnail) return meta.thumbnail
  return meta.refId ? mediaThumbnailUrl(meta.refId, 360) : ''
}

/** 灯箱大图地址 */
function mediaLargeSrc(meta: RecipeMedia): string {
  if (meta.thumbnail) return meta.thumbnail
  return meta.refId ? mediaThumbnailUrl(meta.refId, 1200) : ''
}

/** 点击图片瓦片 → 放大预览 */
function previewImage(media: RecipeMedia): void {
  if (!mediaTileSrc(media)) return
  const images = medias.value.filter((m) => m.meta.kind === 'image')
  const target = images.findIndex((m) => m.meta.id === media.id)
  if (target >= 0) {
    lightboxStart.value = target
    lightboxOpen.value = true
  }
}

/* ---------------- 视频全屏预览 ---------------- */
const videoOpen = ref(false)
const videoSrc = ref('')
const videoPoster = ref('')
const videoName = ref('')
/** 云端视频播放直链缓存（refId -> url），避免重复取签名 */
const videoUrlCache = ref<Record<string, string>>({})
/** 当前预览使用中的本地 objectURL（关闭预览时回收） */
let activeObjectUrl: string | null = null

async function previewVideo(media: RecipeMedia): Promise<void> {
  const entry = medias.value.find((m) => m.meta.id === media.id)
  if (!entry) return

  let src = ''
  if (entry.blob) {
    // 本地新增文件：直接使用对象 URL
    src = URL.createObjectURL(entry.blob)
    activeObjectUrl = src
  } else if (media.refId) {
    const cached = videoUrlCache.value[media.refId]
    if (cached) src = cached
    else {
      try {
        src = await ossApi.getPublicFilePlayUrl(media.refId)
        videoUrlCache.value[media.refId] = src
      } catch {
        showToast('视频暂不可播放，请稍后再试', 'error')
        return
      }
    }
  }
  if (!src) return

  videoSrc.value = src
  videoPoster.value =
    media.thumbnail || (media.refId ? mediaThumbnailUrl(media.refId, 720) : '')
  videoName.value = media.name
  videoOpen.value = true
}

/** 瓦片点击分流：图片进灯箱，视频进播放器 */
function onTileClick(media: RecipeMedia): void {
  if (media.kind === 'image') {
    previewImage(media)
    return
  }
  void previewVideo(media)
}

// 关闭预览后回收临时对象 URL
watch(videoOpen, (open) => {
  if (!open) {
    if (activeObjectUrl) {
      URL.revokeObjectURL(activeObjectUrl)
      activeObjectUrl = null
    }
    videoSrc.value = ''
    videoPoster.value = ''
  }
})

/** 预览灯箱：图片地址集合（本地预览或服务端大图） */
const lightboxOpen = ref(false)
const lightboxStart = ref(0)
const previewSrcs = computed<string[]>(() =>
  medias.value
    .filter((m) => m.meta.kind === 'image')
    .map((m) => mediaLargeSrc(m.meta))
    .filter((src): src is string => Boolean(src)),
)

/* ---------------- 保存 ---------------- */
async function handleSave(): Promise<void> {
  const trimmedName = name.value.trim()
  if (!trimmedName) {
    showToast('先给菜谱起个名字吧', 'error')
    nameInput.value?.focus()
    return
  }
  if (processing.value || saving.value) return

  saving.value = true
  try {
    const draft = { name: trimmedName, note: note.value, medias: medias.value }
    let saved: Recipe
    if (isEdit.value && recipeId.value) {
      saved = await store.updateRecipe(recipeId.value, draft)
      showToast('修改已保存', 'success')
    } else {
      saved = await store.createRecipe(draft)
      showToast('菜谱已保存', 'success')
    }
    // 放行下一次路由跳转（不再询问“未保存”）
    allowLeave = true
    router.replace({ name: 'recipe-detail', params: { id: saved.id } })
  } catch (error) {
    showToast(error instanceof Error ? error.message : '保存失败，请重试', 'error')
  } finally {
    saving.value = false
  }
}

/* ---------------- 未保存离开保护 ---------------- */
const leaveDialogOpen = ref(false)
let leaveResolve: ((value: boolean) => void) | null = null
let allowLeave = false

onBeforeRouteLeave(() => {
  if (allowLeave || !isDirty.value) return true
  // 弹确认框；用户确认后才真正放行
  leaveDialogOpen.value = true
  return new Promise<boolean>((resolve) => {
    leaveResolve = resolve
  })
})

function onLeaveConfirmed(): void {
  leaveResolve?.(true)
  leaveResolve = null
}

function onLeaveCancelled(): void {
  leaveResolve?.(false)
  leaveResolve = null
}

onBeforeUnmount(() => {
  // 清理可能残留的确认框状态
  leaveResolve?.(false)
  // 预览开着时离开页面，回收临时对象 URL
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl)
})
</script>

<template>
  <div class="page editor-page">
    <AppHeader :title="isEdit ? '编辑菜谱' : '新建菜谱'" />

    <!-- 内容主体 -->
    <div class="page-body editor-page__body">
      <template v-if="loaded">
        <!-- 名称 -->
        <section class="editor-card">
          <label class="field__label" for="recipe-name">
            菜谱名称
            <span class="field__extra">{{ nameChars }}/40</span>
          </label>
          <input
            id="recipe-name"
            ref="nameInput"
            v-model="name"
            class="input"
            type="text"
            maxlength="40"
            placeholder="给它起个名字，如：番茄炒蛋"
            autocomplete="off"
          />
        </section>

        <!-- 影像 -->
        <section class="editor-card">
          <div class="field__label">
            照片与视频
            <span class="field__extra">{{ mediaSummary || '还未添加' }}</span>
          </div>

          <!-- 添加来源按钮 -->
          <div class="media-add">
            <button type="button" class="media-add__btn" :disabled="processing" @click="pickVia('photo')">
              <AppIcon name="camera" :size="1.125" />
              <span>拍照</span>
            </button>
            <button type="button" class="media-add__btn" :disabled="processing" @click="pickVia('video')">
              <AppIcon name="video" :size="1.125" />
              <span>录像</span>
            </button>
            <button type="button" class="media-add__btn" :disabled="processing" @click="pickVia('album')">
              <AppIcon name="image" :size="1.125" />
              <span>相册</span>
            </button>
          </div>

          <!-- 已选媒体网格 -->
          <div
            v-if="medias.length > 0 || processing"
            class="media-grid"
            @dragover="onDragOver"
            @drop.prevent="onDrop"
          >
            <div
              v-for="(item, index) in medias"
              :key="item.meta.id"
              class="media-tile"
              :class="{ 'media-tile--video': item.meta.kind === 'video' }"
            >
              <button
                type="button"
                class="media-tile__preview"
                :aria-label="item.meta.kind === 'image' ? '预览照片' : '预览视频'"
                @click="onTileClick(item.meta)"
              >
                <img
                  v-if="mediaTileSrc(item.meta)"
                  :src="mediaTileSrc(item.meta)"
                  :alt="item.meta.name"
                />
                <span v-else class="media-tile__placeholder">
                  <AppIcon :name="item.meta.kind === 'video' ? 'video' : 'image'" :size="1.75" />
                </span>
                <span v-if="item.meta.kind === 'video'" class="media-tile__play">
                  <AppIcon name="play" :size="0.8125" />
                </span>
                <span
                  v-if="item.meta.kind === 'video' && item.meta.duration"
                  class="chip media-tile__duration"
                >
                  {{ formatDuration(item.meta.duration) }}
                </span>
              </button>

              <button
                type="button"
                class="media-tile__remove"
                aria-label="移除"
                @click="removeMedia(index)"
              >
                <AppIcon name="close" :size="0.9375" />
              </button>
            </div>

            <!-- 处理中的占位瓦片 -->
            <div v-if="processing" class="media-tile media-tile--loading">
              <span class="media-tile__spinner" aria-hidden="true" />
            </div>
          </div>

          <!-- 空媒体引导：点击打开相册 / 拖拽放入（仅未添加任何影像时） -->
          <button
            v-else
            type="button"
            class="media-dropzone"
            @click="pickVia('album')"
            @dragover="onDragOver"
            @drop.prevent="onDrop"
          >
            <AppIcon name="image" :size="1.875" />
            <span class="media-dropzone__main">点击选择照片或视频</span>
            <span class="media-dropzone__sub">也可以把 JPG / PNG / MP4 / MOV 文件直接拖到这里</span>
          </button>
        </section>

        <!-- 备注 -->
        <section class="editor-card">
          <label class="field__label" for="recipe-note">
            备注说明
            <span class="field__extra">{{ noteChars }}/500</span>
          </label>
          <textarea
            id="recipe-note"
            v-model="note"
            class="textarea"
            maxlength="500"
            rows="5"
            placeholder="写点想记住的：做法、窍门、食材用量，或这道菜背后的故事…"
          />
        </section>
      </template>

      <!-- 编辑加载骨架 -->
      <div v-else class="editor-page__skeleton">
        <span class="skeleton editor-skeleton__name" />
        <span class="skeleton editor-skeleton__area" />
        <span class="skeleton editor-skeleton__area" />
      </div>
    </div>

    <!-- 底部保存栏 -->
    <footer class="editor-savebar">
      <button
        type="button"
        class="btn btn--primary btn--block"
        :disabled="processing || saving"
        @click="handleSave"
      >
        <AppIcon v-if="saving" name="clock" :size="1.125" />
        <span>{{ saving ? '保存中…' : isEdit ? '保存修改' : '保存菜谱' }}</span>
      </button>
    </footer>

    <!-- 隐藏的文件输入（拍照/录像/相册） -->
    <input
      ref="photoInput"
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      @change="onFilesChosen"
    />
    <input
      ref="videoInput"
      type="file"
      accept="video/*"
      capture="environment"
      hidden
      @change="onFilesChosen"
    />
    <input
      ref="albumInput"
      type="file"
      accept="image/*,video/*"
      multiple
      hidden
      @change="onFilesChosen"
    />

    <!-- 未保存确认 -->
    <ConfirmDialog
      v-model:open="leaveDialogOpen"
      title="放弃未保存的内容？"
      message="离开后，本次填写和添加的影像将不会被保存。"
      confirm-text="放弃"
      cancel-text="继续编辑"
      danger
      @confirm="onLeaveConfirmed"
      @cancel="onLeaveCancelled"
    />

    <!-- 图片预览灯箱 -->
    <MediaLightbox v-model:open="lightboxOpen" :srcs="previewSrcs" :start="lightboxStart" />

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
@use '../styles/mixins' as *;

.editor-page {
  &__body {
    padding-top: 1.375rem;
    padding-bottom: calc(7.5rem + var(--safe-bottom, 0rem));
  }

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}

/* 表单卡片（白底、圆角、留白充足） */
.editor-card {
  padding: 1.25rem;
  margin-bottom: 1.375rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

/* 添加媒体来源 */
.media-add {
  display: flex;
  gap: 0.75rem;

  &__btn {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 0.4375rem;
    min-height: 3rem;
    padding: 0 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    background: var(--color-field);
    color: var(--color-ink-700);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    @include pressable;

    &[disabled] {
      opacity: 0.55;
      pointer-events: none;
    }
  }

}

/* 空媒体引导：虚线大卡，点击选择或拖拽放入 */
.media-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;
  width: 100%;
  margin-top: 1.125rem;
  padding: 1.375rem 1rem;
  border: 1.5px dashed var(--color-brand-300);
  border-radius: var(--radius-md);
  background: var(--color-brand-50);
  color: var(--color-brand-500);
  cursor: pointer;
  @include pressable;

  .app-icon {
    margin-bottom: 0.3125rem;
  }

  &:active {
    border-color: var(--color-brand-500);
  }

  &__main {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-ink-700);
  }

  &__sub {
    font-size: 0.75rem;
    color: var(--color-ink-300);
  }
}

/* 已选媒体网格 */
.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5625rem;
  margin-top: 1.125rem;
}

.media-tile {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-field);

  &__preview {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--color-ink-300);
    background: linear-gradient(150deg, var(--color-brand-50), var(--color-field));
  }

  &__play {
    position: absolute;
    left: 50%;
    top: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: rgba(20, 12, 6, 0.55);
    color: #fff;
    transform: translate(-50%, -50%);
    backdrop-filter: blur(2px);
    pointer-events: none;
  }

  &__duration {
    position: absolute;
    right: 0.375rem;
    bottom: 0.375rem;
    pointer-events: none;
  }

  &__remove {
    position: absolute;
    top: 0.3125rem;
    right: 0.3125rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    border-radius: 50%;
    background: rgba(20, 12, 6, 0.55);
    color: #fff;
    cursor: pointer;
    backdrop-filter: blur(2px);
    transition: background-color 0.15s ease;

    &:active {
      background: rgba(20, 12, 6, 0.75);
    }
  }

  &--loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__spinner {
    width: 1.375rem;
    height: 1.375rem;
    border: 0.1875rem solid var(--color-brand-200);
    border-top-color: var(--color-brand-500);
    border-radius: 50%;
    animation: editor-spin 0.8s linear infinite;
  }
}

@keyframes editor-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 底部保存栏（悬浮，随“手机壳”宽度） */
.editor-savebar {
  position: fixed;
  bottom: 0;
  left: 50%;
  z-index: 30;
  width: min(100vw, 30rem);
  padding: 0.75rem 1.25rem calc(0.75rem + var(--safe-bottom, 0rem));
  transform: translateX(-50%);
  background: rgba(246, 241, 233, 0.96);
  border-top: 1px solid rgba(74, 46, 30, 0.06);
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
}

.editor-skeleton {
  &__name {
    display: block;
    height: 4.75rem;
    border-radius: var(--radius-lg);
  }

  &__area {
    display: block;
    height: 9rem;
    border-radius: var(--radius-lg);
  }
}
</style>
