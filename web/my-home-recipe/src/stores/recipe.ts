// ============================================================
// 菜谱状态管理（Pinia）—— 数据源：my-home-service 云端
// ------------------------------------------------------------
//  - 列表/详情/保存/删除均调用后端接口
//  - 保存前自动把「新增媒体（有 blob）」上传 OSS 换取 refId，
//    保留媒体（blob 为 null）直接沿用已有 refId
//  - 维护内存态列表供 UI 渲染，UI 模型字段与后端字段在此转换
// ============================================================

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { ApiMedia, ApiRecipe } from '@/types/api'
import type { MediaInput, Recipe, RecipeMedia } from '@/types/recipe'
import { recipeApi } from '@/services/api'
import { uploadMediaToOss } from '@/services/ossUpload'

/** 单页拉取上限：家庭场景一次拉全足够，后续可切换分页/滚动加载 */
const PAGE_SIZE = 200

/** 后端媒体 -> UI 媒体（id 与 refId 一致） */
export function toUiMedia(api: ApiMedia): RecipeMedia {
  return {
    id: api.refId,
    refId: api.refId,
    kind: api.kind,
    name: api.name,
    mimeType: api.mimeType,
    size: api.size,
    ...(api.width !== undefined ? { width: api.width } : {}),
    ...(api.height !== undefined ? { height: api.height } : {}),
    ...(api.duration !== undefined ? { duration: api.duration } : {}),
  }
}

/** 后端菜谱 -> UI 菜谱 */
export function toUiRecipe(api: ApiRecipe): Recipe {
  return {
    id: api.recipeId,
    name: api.recipeName,
    note: api.note ?? '',
    medias: (api.medias ?? []).map(toUiMedia),
    createdAt: api.createdTime,
    updatedAt: api.updatedTime,
  }
}

/** UI 媒体 -> 后端保存媒体（要求已具备 refId） */
function toApiMedia(meta: RecipeMedia): ApiMedia {
  if (!meta.refId) throw new Error('媒体尚未上传，缺少云端引用')
  const media: ApiMedia = {
    refId: meta.refId,
    kind: meta.kind,
    name: meta.name,
    mimeType: meta.mimeType,
    size: meta.size,
  }
  if (meta.width !== undefined) media.width = meta.width
  if (meta.height !== undefined) media.height = meta.height
  if (meta.duration !== undefined) media.duration = meta.duration
  return media
}

/** 新建/编辑表单的统一输入 */
export interface RecipeDraft {
  name: string
  note: string
  medias: MediaInput[]
}

export const useRecipeStore = defineStore('recipe', () => {
  /** 内存中的菜谱列表（渲染时用 sorted） */
  const recipes = ref<Recipe[]>([])
  /** 是否已从服务端加载过 */
  const loaded = ref(false)
  /** 是否正在加载 */
  const loading = ref(false)

  /** 展示用：按最近更新倒序 */
  const sortedRecipes = computed<Recipe[]>(() =>
    [...recipes.value].sort((a, b) => b.updatedAt - a.updatedAt),
  )

  /** 首次进入列表时拉取菜谱 */
  async function fetchAll(force = false): Promise<void> {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const page = await recipeApi.list({ pageNum: 1, pageSize: PAGE_SIZE })
      recipes.value = page.records.map(toUiRecipe)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /** 新增插入/更新替换内存中的某条记录 */
  function upsertLocal(recipe: Recipe): void {
    const index = recipes.value.findIndex((r) => r.id === recipe.id)
    if (index === -1) recipes.value.push(recipe)
    else recipes.value[index] = recipe
  }

  /**
   * 编排上传：把待保存媒体列表转成服务端参数。
   * 新增文件（blob 有值）逐个上传 OSS 换取 refId；完成后把
   * refId 回填到 meta，方便后续逻辑与 UI 使用。
   */
  async function resolveMediaParams(medias: MediaInput[]): Promise<ApiMedia[]> {
    const params: ApiMedia[] = []
    for (const input of medias) {
      const { meta, blob } = input
      if (blob) {
        const refId = await uploadMediaToOss(blob, {
          name: meta.name,
          mimeType: meta.mimeType,
        })
        meta.refId = refId
        meta.id = refId
        params.push(toApiMedia(meta))
      } else {
        params.push(toApiMedia(meta))
      }
    }
    return params
  }

  /** 新建菜谱 */
  async function createRecipe(draft: RecipeDraft): Promise<Recipe> {
    const medias = await resolveMediaParams(draft.medias)
    const api = await recipeApi.save({
      recipeName: draft.name.trim(),
      note: draft.note.trim() || undefined,
      medias,
    })
    const recipe = toUiRecipe(api)
    upsertLocal(recipe)
    loaded.value = true
    return recipe
  }

  /**
   * 更新菜谱（移除的媒体随提交内容差异由服务端自动释放引用）
   */
  async function updateRecipe(id: string, draft: RecipeDraft): Promise<Recipe> {
    const medias = await resolveMediaParams(draft.medias)
    const api = await recipeApi.save({
      recipeId: id,
      recipeName: draft.name.trim(),
      note: draft.note.trim() || undefined,
      medias,
    })
    const recipe = toUiRecipe(api)
    upsertLocal(recipe)
    return recipe
  }

  /** 删除菜谱（服务端同步释放媒体引用与文件） */
  async function removeRecipe(id: string): Promise<void> {
    await recipeApi.remove(id)
    const index = recipes.value.findIndex((r) => r.id === id)
    if (index !== -1) recipes.value.splice(index, 1)
  }

  /** 通过 id 获取内存态菜谱（详情/编辑页初始化用） */
  function getById(id: string): Recipe | undefined {
    return recipes.value.find((r) => r.id === id)
  }

  return {
    recipes,
    loaded,
    loading,
    sortedRecipes,
    fetchAll,
    createRecipe,
    updateRecipe,
    removeRecipe,
    getById,
  }
})
