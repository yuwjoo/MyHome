/**
 * @file 发布日志 hook
 * @description 订阅主进程推送的发布日志，按项目维度聚合存储并提供读取 / 清理能力
 */
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import type { ComputedRef } from 'vue'
import type { IPublishLogMsg } from '@shared/types/ipc/publish'
import { electronApi } from '@renderer/utils/electronApi'
import type { IPublishLogItem } from '../types/publish'
import { resolveProjectKey } from '../utils/project'

/**
 * 单个项目保留的最新日志条数
 *
 * 超出后丢弃最早的日志，避免长时间挂着的应用无限堆积发布日志
 */
const MAX_LOG_COUNT = 500

/**
 * 发布日志能力
 */
export interface IUsePublishLog {
  /**
   * 取某个项目的日志列表
   * @param projectKey 项目标识
   * @returns 该项目的日志列表，没有日志时为空数组
   */
  logsOf: (projectKey: string) => IPublishLogItem[]
  /**
   * 清空某个项目的日志
   * @param projectKey 项目标识
   */
  clearLogs: (projectKey: string) => void
  /**
   * 清空全部项目的日志
   */
  clearAllLogs: () => void
  /**
   * 全部项目的日志，按推送顺序升序排列
   */
  allLogs: ComputedRef<IPublishLogItem[]>
  /**
   * 全部项目的日志总条数
   */
  logCount: ComputedRef<number>
}

/**
 * 订阅发布日志
 *
 * 在挂载时订阅 publish:publishLog 推送，卸载时以同一回调引用取消订阅；
 * 日志只存在于当前页面会话内，刷新页面即清空
 * @param onPush 收到一条日志后的回调，用于同步发布阶段等业务状态
 * @returns 发布日志读取与清理能力
 */
export function usePublishLog(onPush?: (log: IPublishLogItem) => void): IUsePublishLog {
  // 项目标识 -> 该项目的日志列表
  const logMap = reactive<Record<string, IPublishLogItem[]>>({})
  // 日志序号种子：自增且全页面唯一
  let seed = 0

  /**
   * 主进程日志推送回调：补上序号与时间戳后按项目归堆
   * @param _event 推送事件，页面不使用
   * @param log 主进程推送的日志
   */
  const handlePublishLog = (_event: unknown, log: IPublishLogMsg): void => {
    const projectKey = resolveProjectKey(log)
    const logItem: IPublishLogItem = { ...log, id: ++seed, time: Date.now() }
    const list = logMap[projectKey] ?? []
    list.push(logItem)
    if (list.length > MAX_LOG_COUNT) list.splice(0, list.length - MAX_LOG_COUNT)
    logMap[projectKey] = list
    onPush?.(logItem)
  }

  onMounted(() => {
    electronApi.addListener('publish:publishLog', handlePublishLog)
  })

  onBeforeUnmount(() => {
    electronApi.removeListener('publish:publishLog', handlePublishLog)
  })

  return {
    logsOf: (projectKey: string): IPublishLogItem[] => logMap[projectKey] ?? [],
    clearLogs: (projectKey: string): void => {
      logMap[projectKey] = []
    },
    clearAllLogs: (): void => {
      Object.keys(logMap).forEach((projectKey) => {
        logMap[projectKey] = []
      })
    },
    allLogs: computed(() =>
      Object.values(logMap)
        .flat()
        .sort((left, right) => left.id - right.id)
    ),
    logCount: computed(() =>
      Object.values(logMap).reduce((total, list) => total + list.length, 0)
    )
  }
}
