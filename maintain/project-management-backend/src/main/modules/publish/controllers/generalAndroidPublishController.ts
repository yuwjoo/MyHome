/**
 * @file 通用android发布控制器
 * @description 通用 android 项目发布：改 app/build.gradle.kts 版本号 -> gradlew assembleRelease -> 上传 APK 到 OSS（公共读）-> 更新版本清单
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { myHomeStore } from '@main/stores/myHomeStore'
import { updateProjectVersion } from '../modules/manifest'
import { getOssClient } from '../modules/oss'
import { Shell } from '../modules/shell'
import { versionToCode } from '../utils/version'
import { PublishController } from './common/publishController'
import type { IPublishNodeParams, TPublishLogger } from './common/types/publish'

// gradle 应用模块目录名（相对项目目录）
const APP_DIR_NAME = 'app'
// gradle 版本配置文件（位于 app 目录下）
const GRADLE_FILE_NAME = 'build.gradle.kts'
// release APK 路径（相对项目目录）
const RELEASE_APK_RELATIVE_PATH = 'app/build/outputs/apk/release/app-release.apk'
// OSS 公共读权限头
const OSS_PUBLIC_READ_HEADERS = { 'x-oss-object-acl': 'public-read' }
// gradlew 脚本名：Windows 下为批处理，其他平台为 shell 脚本
const GRADLEW_NAME = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'

/**
 * 通用android发布控制器
 *
 * 准备：校验 Android 构建环境（JDK / SDK）与 gradle 配置文件存在
 * 构建：把 app/build.gradle.kts 的 versionCode / versionName 改成目标版本 -> 执行 gradlew assembleRelease
 * 上传：把 release APK 传到 OSS 的 ossPublishDir 目录下，权限为公共读
 * 结束：把本次版本号写进版本清单并上传 OSS
 */
export class GeneralAndroidPublishController extends PublishController {
  /**
   * 发布准备：校验构建环境与 gradle 版本配置文件存在
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发准备过程消息
   * @throws 未配置 JDK / SDK，或 gradle 配置文件不存在时抛错
   */
  protected async prepare(params: IPublishNodeParams, log: TPublishLogger): Promise<void> {
    const buildEnv = this.resolveBuildEnv()
    const gradlePath = this.resolveProjectPath(APP_DIR_NAME, GRADLE_FILE_NAME)
    if (!existsSync(gradlePath)) throw new Error(`发布准备失败：${gradlePath} 不存在`)
    log(`构建环境：JDK=${buildEnv.JAVA_HOME}，SDK=${buildEnv.ANDROID_HOME}`)
    log(`准备发布 v${params.targetVersion}`)
  }

  /**
   * 构建产物：改 gradle 版本号、执行 gradlew assembleRelease
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发构建过程消息
   */
  protected async build(params: IPublishNodeParams, log: TPublishLogger): Promise<void> {
    const versionCode = versionToCode(params.targetVersion)
    this.writeGradleVersion(params.targetVersion, versionCode)
    log(`版本号已更新：versionName = ${params.targetVersion}，versionCode = ${versionCode}`)
    await this.runGradleRelease(log)
    log(`构建完成：${this.resolveProjectPath(RELEASE_APK_RELATIVE_PATH)}`)
  }

  /**
   * 上传产物：把 release APK 传到 OSS 的 ossPublishDir 目录下
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发上传过程消息
   * @throws 未找到构建产物（APK）时抛错
   */
  protected async upload(params: IPublishNodeParams, log: TPublishLogger): Promise<void> {
    const apkPath = this.resolveProjectPath(RELEASE_APK_RELATIVE_PATH)
    if (!existsSync(apkPath)) throw new Error(`上传失败：未找到构建产物 ${apkPath}`)
    // OSS 未绑定自定义域名时不允许下载 apk，产物统一以 .zip 后缀存放
    const objectName = this.resolveOssPath(`v${params.targetVersion}.zip`)
    log(`正在上传到 OSS：${objectName}`)
    await getOssClient().put(objectName, apkPath, {
      headers: OSS_PUBLIC_READ_HEADERS
    })
    log(`上传完成：${objectName}`)
  }

  /**
   * 发布结束：把本次版本号写进版本清单（并上传 OSS）
   * @param params 节点参数，取其中的目标版本号
   * @param log 日志发送器，转发结束过程消息
   * @throws 版本清单更新失败时抛错
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
  }

  /**
   * 取 Android 构建环境变量：JDK 与 SDK 取自本地 androidStudio 配置
   * @returns 注入子进程的环境变量
   * @throws 未配置 androidStudio.jdkPath / sdkPath 时抛错
   */
  private resolveBuildEnv(): NodeJS.ProcessEnv {
    const { jdkPath, sdkPath } = myHomeStore.get('local').androidStudio
    if (!jdkPath) throw new Error('发布准备失败：未配置 androidStudio.jdkPath')
    if (!sdkPath) throw new Error('发布准备失败：未配置 androidStudio.sdkPath')
    return { JAVA_HOME: jdkPath, ANDROID_HOME: sdkPath, ANDROID_SDK_ROOT: sdkPath }
  }

  /**
   * 把 app/build.gradle.kts 的 versionCode 与 versionName 改为目标版本
   * @param targetVersion 本次发布的目标版本号
   * @param versionCode 由目标版本号推导出的 versionCode
   */
  private writeGradleVersion(targetVersion: string, versionCode: number): void {
    const gradlePath = this.resolveProjectPath(APP_DIR_NAME, GRADLE_FILE_NAME)
    const content = readFileSync(gradlePath, 'utf-8')
      .replace(/versionCode\s*=\s*\d+/, `versionCode = ${versionCode}`)
      .replace(/versionName\s*=\s*"[^"]*"/, `versionName = "${targetVersion}"`)
    writeFileSync(gradlePath, content, 'utf-8')
  }

  /**
   * 在项目目录执行 gradlew assembleRelease，并等待执行结束
   * @param log 日志发送器，转发构建命令的 stdout / stderr 输出
   * @throws 构建被终止、启动失败或退出码非 0 时抛错
   */
  private async runGradleRelease(log: TPublishLogger): Promise<void> {
    const buildEnv = this.resolveBuildEnv()
    await new Promise<void>((res, rej) => {
      const shell = new Shell({
        cwd: this.projectInfo.projectPath,
        env: buildEnv,
        onLog: (item): void => log(item.data),
        onExit: (exit): void => {
          if (exit.killed) {
            rej(new Error(`构建失败：${GRADLEW_NAME} assembleRelease 被终止`))
            return
          }
          if (exit.code !== 0) {
            rej(
              new Error(`构建失败：${GRADLEW_NAME} assembleRelease 退出码 ${exit.code ?? '未知'}`)
            )
            return
          }
          res()
        }
      })
      shell.run(`${GRADLEW_NAME} assembleRelease`)
    })
  }

  /**
   * 拼项目目录下的本地路径
   * @param segments 相对项目目录的路径片段
   * @returns 本地绝对路径
   */
  private resolveProjectPath(...segments: string[]): string {
    return resolve(this.projectInfo.projectPath, ...segments)
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
