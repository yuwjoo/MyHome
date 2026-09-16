/**
 * @file 发布控制器基类
 * @description 约定发布流程：构造只注入项目信息，调用方触发 publish 后按「先构建、后上传」执行，
 * 两步具体逻辑由继承方实现，基类不感知任何具体构建/上传方式
 * @see 与 publish/modules/shell 的约定一致：构造不产生副作用
 */
import type { IProjectInfo } from '@shared/types/config'

/**
 * 发布控制器基类
 *
 * 只定义流程骨架与入参：
 * 继承方实现 build / upload，调用方通过 publish 触发完整发布
 */
export abstract class BasePublishController {
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
   * 构建产物
   *
   * 由继承方实现：按 projectInfo.projectType 执行对应构建流程，
   * 产物路径等中间结果由继承方自行维护（可存到自己的成员上供 upload 使用）
   */
  protected abstract build(): Promise<void>

  /**
   * 上传产物
   *
   * 由继承方实现：把 build 产出的文件上传到目标位置（如 OSS 的 ossPublishDir）
   */
  protected abstract upload(): Promise<void>

  /**
   * 执行发布：先构建，构建结束后再上传
   *
   * 顺序固定为 build -> upload；任一步失败即中断后续步骤，错误抛给调用方处理
   */
  async publish(): Promise<void> {
    await this.build()
    await this.upload()
  }
}
