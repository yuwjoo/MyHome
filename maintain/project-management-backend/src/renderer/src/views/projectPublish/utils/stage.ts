/**
 * @file 发布阶段工具
 * @description 定义发布阶段的顺序与展示用的文案、标签类型
 */
import type { TPublishStage } from '@shared/types/ipc/publish'

/**
 * 发布阶段顺序，与发布流程「准备 -> 构建 -> 上传 -> 结束」一致
 */
const stageOrder: TPublishStage[] = ['prepare', 'build', 'upload', 'finish']

/**
 * 阶段展示信息：key 为阶段标识，value 为文案与标签类型
 */
export const stageMeta: Record<
  TPublishStage,
  { label: string; type: 'primary' | 'success' | 'warning' | 'info' }
> = {
  // 准备：校验环境与目录
  prepare: { label: '准备', type: 'info' },
  // 构建：执行构建命令产出压缩包
  build: { label: '构建', type: 'primary' },
  // 上传：把产物传到 OSS 并同步版本清单
  upload: { label: '上传', type: 'warning' },
  // 结束：清理本地临时产物
  finish: { label: '结束', type: 'success' }
}

/**
 * 取全部发布阶段（按发布流程顺序）
 * @returns 发布阶段列表
 */
export function listStages(): TPublishStage[] {
  return [...stageOrder]
}

/**
 * 取阶段在发布流程中的序号（0 起）
 * @param stage 发布阶段
 * @returns 阶段序号，未收录时为 -1
 */
export function resolveStageIndex(stage: TPublishStage): number {
  return stageOrder.indexOf(stage)
}
