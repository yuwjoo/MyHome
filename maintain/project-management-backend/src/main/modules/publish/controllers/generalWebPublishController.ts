/**
 * @file 通用web发布控制器
 * @description 通用 web 项目发布：改 package.json 版本号 -> npm run build -> 压缩 dist -> 上传 OSS（公共读）-> 更新版本清单
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { zip } from 'compressing'
import { updateProjectVersion } from '../modules/manifest'
import { getOssClient } from '../modules/oss'
import { Shell } from '../modules/shell'
import { PublishController } from './common/publishController'
import type { IPublishNodeParams, TPublishLogger } from './common/types/publish'

// web 项目构建产物目录名（相对项目目录）
const DIST_DIR_NAME = 'dist'
// OSS 公共读权限头
const OSS_PUBLIC_READ_HEADERS = { 'x-oss-object-acl': 'public-read' }

/**
 * 通用web发布控制器
 *
 * 准备：校验 package.json 存在 -> 清掉上一次的同名压缩包
 * 构建：把 package.json 的 version 改成目标版本号 -> 执行 npm run build -> 把 dist 压成 v{版本号}.zip
 * 上传：把压缩产物传到 OSS 的 ossPublishDir 目录下，权限为公共读
 * 结束：把本次版本号写进版本清单并上传 OSS -> 删除本地压缩包并复位中间状态
 */
export class GeneralWebPublishController extends PublishController {
  /**
   * 压缩产物本地路径，build 阶段写入，upload 阶段读取
   */
  private zipPath = ''

  /**
   * 发布准备：校验项目目录与 package.json 存在，并清掉上一次的同名压缩包
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发准备过程消息
   * @throws package.json 不存在时抛错
   */
  protected async prepare(params: IPublishNodeParams, log: TPublishLogger): Promise<void> {
    const packagePath = resolve(this.projectInfo.projectPath, 'package.json')
    if (!existsSync(packagePath)) throw new Error(`发布准备失败：${packagePath} 不存在`)
    rmSync(this.resolveZipPath(params.targetVersion), { force: true })
    log(`准备发布 v${params.targetVersion}`)
  }

  /**
   * 构建产物：改版本号、执行构建命令、压缩 dist
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发构建过程消息
   */
  protected async build(params: IPublishNodeParams, log: TPublishLogger): Promise<void> {
    this.writePackageVersion(params.targetVersion)
    await this.runNpmBuild(log)
    this.zipPath = await this.compressDist(params.targetVersion)
    log(`压缩完成：${this.zipPath}`)
  }

  /**
   * 上传产物：把压缩产物传到 OSS 的 ossPublishDir 目录下
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发上传过程消息
   * @throws 未执行构建（没有压缩产物）时抛错
   */
  protected async upload(params: IPublishNodeParams, log: TPublishLogger): Promise<void> {
    if (!this.zipPath) throw new Error('上传失败：未找到压缩产物，请先执行构建')
    const objectName = this.resolveOssPath(`v${params.targetVersion}.zip`)
    log(`正在上传到 OSS：${objectName}`)
    await getOssClient().put(objectName, this.zipPath, {
      headers: OSS_PUBLIC_READ_HEADERS
    })
    log(`上传完成：${objectName}`)
  }

  /**
   * 发布结束：把本次版本号写进版本清单（并上传 OSS），再删除本地压缩包并复位中间状态
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发结束过程消息
   * @throws 版本清单更新失败时抛错（此时本地压缩包保留，便于排查）
   */
  protected async finish(params: IPublishNodeParams, log: TPublishLogger): Promise<void> {
    // 发布已走到这里即产物上传成功，清单同步上传 OSS 才算本次发布闭环
    await updateProjectVersion(
      this.projectInfo.projectType,
      this.projectInfo.projectName,
      params.targetVersion,
      true
    )
    log(
      `版本清单已更新：${this.projectInfo.projectType}/${this.projectInfo.projectName} -> v${params.targetVersion}`
    )
    rmSync(this.resolveZipPath(params.targetVersion), { force: true })
    this.zipPath = ''
    log(`发布结束：已删除 v${params.targetVersion}.zip`)
  }

  /**
   * 把项目 package.json 的 version 字段改为目标版本号
   * @param targetVersion 本次发布的目标版本号
   */
  private writePackageVersion(targetVersion: string): void {
    const packagePath = resolve(this.projectInfo.projectPath, 'package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8')) as Record<string, unknown>
    packageJson.version = targetVersion
    writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')
  }

  /**
   * 在项目目录执行 npm run build，并等待执行结束
   * @param log 日志发送器，转发构建命令的 stdout / stderr 输出
   * @throws 构建被终止、启动失败或退出码非 0 时抛错
   */
  private async runNpmBuild(log: TPublishLogger): Promise<void> {
    await new Promise<void>((res, rej) => {
      const shell = new Shell({
        cwd: this.projectInfo.projectPath,
        onLog: (item): void => log(item.data),
        onExit: (exit): void => {
          if (exit.killed) {
            rej(new Error('构建失败：npm run build 被终止'))
            return
          }
          if (exit.code !== 0) {
            rej(new Error(`构建失败：npm run build 退出码 ${exit.code ?? '未知'}`))
            return
          }
          res()
        }
      })
      shell.run('npm run build')
    })
  }

  /**
   * 把 dist 目录压缩为 zip，产物放在项目目录下，文件名 v{版本号}.zip
   * @param targetVersion 本次发布的目标版本号
   * @returns 压缩产物本地路径
   */
  private async compressDist(targetVersion: string): Promise<string> {
    const distPath = resolve(this.projectInfo.projectPath, DIST_DIR_NAME)
    const zipPath = this.resolveZipPath(targetVersion)
    await zip.compressDir(distPath, zipPath)
    return zipPath
  }

  /**
   * 拼本地压缩包路径：项目目录下的 v{版本号}.zip
   * @param targetVersion 本次发布的目标版本号
   * @returns 压缩包本地路径
   */
  private resolveZipPath(targetVersion: string): string {
    return resolve(this.projectInfo.projectPath, `v${targetVersion}.zip`)
  }

  /**
   * 拼 OSS 对象路径：ossPublishDir 目录下的指定文件
   * @param fileName 文件名
   * @returns OSS 对象路径
   */
  private resolveOssPath(fileName: string): string {
    // 先挂到根目录拼（顺带处理目录两端的斜杠、重复斜杠与空目录），再去掉开头的 /
    return posix.join('/', this.projectInfo.ossPublishDir, fileName).slice(1)
  }
}
