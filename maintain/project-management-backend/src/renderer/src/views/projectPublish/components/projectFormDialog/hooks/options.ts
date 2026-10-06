/**
 * @file 选项数据 hook
 * @description 提供发布控制器选项，以及由已有项目推导出的项目类型提示
 */
import { computed } from 'vue'
import type { Ref } from 'vue'
import type { IProjectInfo, TPublishController } from '@shared/types/config/publishConfig'
import { publishControllerLabels } from '../../../utils/project'
import type { TOptionItem, TUseOptions } from '../types/hooks/options'

/**
 * 表单选项数据：控制器选项来自静态配置，项目类型来自已有项目列表
 * @param projects 已有项目列表的 ref，用 toRef 传入以保证响应式
 * @returns 选项数据
 */
export function useOptions(projects: Ref<IProjectInfo[]>): TUseOptions {
  // 发布控制器选项：由控制器标识与其中文说明推导
  const controllerOptions = computed<TOptionItem<TPublishController>[]>(() =>
    (Object.keys(publishControllerLabels) as TPublishController[]).map((value) => ({
      label: publishControllerLabels[value],
      value
    }))
  )
  // 项目类型提示：已有项目的类型去重，空类型不作为提示
  const projectTypeOptions = computed<string[]>(() => [
    ...new Set(projects.value.map((item) => item.projectType).filter((type) => !!type))
  ])

  return { controllerOptions, projectTypeOptions }
}
