/**
 * @file 发布控制器基类
 * @description 约定发布流程：构造只注入项目信息，调用方触发 publish 后按「准备 -> 构建 -> 上传 -> 清理」执行，
 * 准备/构建/上传/结束四个节点均由继承方实现，各节点通过 log 发出的消息会带上当前阶段回调给外界
 * @see 与 publish/modules/shell 的约定一致：构造不产生副作用
 */
import type { IProjectInfo } from '@shared/types/config'
import type {
  IPublishNodeParams,
  IPublishParams,
  TPublishLogger,
  TPublishStage
} from './types/publish'

/**
 * 发布控制器基类
 *
 * 只定义流程骨架与入参：
 * 继承方实现 prepare / build / upload / finish 四个节点，节点收到节点参数与日志发送器；
 * 调用方通过 publish 传入发布参数，并可用 params.onLog 接收带阶段的日志
 */
export abstract class PublishController {
  /**
   * 待发布的项目信息
   */
  protected readonly projectInfo: IProjectInfo

  /**
   * 创建发布控制器：只保存项目信息，不执行任何发布动作
   * @param projectInfo 待发布的项目信息
   */
  constructor(projectInfo: IProjectInfo) {
    this.projectInfo = projectInfo
  }

  /**
   * 发布准备：构建前执行
   *
   * 由继承方实现：校验项目目录、构建环境，清理历史产物等
   * @param params 节点参数（发布参数去掉日志回调），扩展字段直接从中取
   * @param log 日志发送器，发出的消息会带上 prepare 阶段
   */
  protected abstract prepare(params: IPublishNodeParams, log: TPublishLogger): Promise<void>

  /**
   * 构建产物
   *
   * 由继承方实现：按 params.targetVersion 与 projectInfo.projectType 执行对应构建流程，
   * 产物路径等中间结果由继承方自行维护（可存到自己的成员上供 upload 使用）
   * @param params 节点参数（发布参数去掉日志回调），扩展字段直接从中取
   * @param log 日志发送器，发出的消息会带上 build 阶段
   */
  protected abstract build(params: IPublishNodeParams, log: TPublishLogger): Promise<void>

  /**
   * 上传产物
   *
   * 由继承方实现：把 build 产出的文件上传到目标位置（如 OSS 的 ossPublishDir），
   * 版本目录等按 params.targetVersion 确定
   * @param params 节点参数（发布参数去掉日志回调），扩展字段直接从中取
   * @param log 日志发送器，发出的消息会带上 upload 阶段
   */
  protected abstract upload(params: IPublishNodeParams, log: TPublishLogger): Promise<void>

  /**
   * 发布结束：上传后执行
   *
   * 由继承方实现：不限于清理，可做任何收尾动作 —— 删除本地临时产物、复位中间状态、
   * 更新本地记录的项目版本号等；只有走到这里才表示本次发布成功
   * @param params 节点参数（发布参数去掉日志回调），扩展字段直接从中取
   * @param log 日志发送器，发出的消息会带上 finish 阶段
   */
  protected abstract finish(params: IPublishNodeParams, log: TPublishLogger): Promise<void>

  /**
   * 执行发布：准备 -> 构建 -> 上传 -> 结束
   *
   * 顺序固定；任一步失败即中断后续步骤，错误抛给调用方处理；
   * 节点参数原样传给四个节点，各节点用 log 发出的消息由基类补上当前阶段后回调 params.onLog
   * @param params 发布参数：节点参数 + 可选的日志回调
   */
  async publish(params: IPublishParams): Promise<void> {
    await this.prepare(params, this.createLogger(params, 'prepare'))
    await this.build(params, this.createLogger(params, 'build'))
    await this.upload(params, this.createLogger(params, 'upload'))
    await this.finish(params, this.createLogger(params, 'finish'))
  }

  /**
   * 生成节点函数使用的日志发送器：节点只发消息，由基类补上当前阶段
   * @param params 发布参数
   * @param stage 当前阶段
   * @returns 日志发送器，未传 onLog 或消息为空时不触发回调
   */
  private createLogger(params: IPublishParams, stage: TPublishStage): TPublishLogger {
    return (message: string): void => {
      if (!message || !params.onLog) return
      params.onLog({ stage, message })
    }
  }
}
