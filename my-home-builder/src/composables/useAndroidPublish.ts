/**
 * useAndroidPublish - Android 项目构建发布 Hook
 * 完整发布流程：更新版本清单 → 更新 build.gradle → 构建 APK → 压缩上传 OSS → 上传版本清单
 */
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { LogEntry, PublishTask, BuildStatus } from '@/types/useWebPublish'
import { VERSION_MANIFEST_PATH, getProjectById } from '@/config/projects'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as https from 'node:https'
import { createHash, createHmac } from 'node:crypto'

/**
 * Android 项目路径常量
 */
const ANDROID_PROJECT_PATH = '../android/MyHome'

/**
 * .env.local 文件路径（复用 Web 项目的 OSS 凭证）
 */
const ENV_LOCAL_PATH = '../web/my-home-mobile/.env.local'

/**
 * OSS 上传路径
 */
const OSS_ANDROID_UPLOAD_PATH = 'MyHome/android/MyHome.zip'

/**
 * 版本清单 OSS 路径
 */
const OSS_MANIFEST_PATH = 'MyHome/versionManifest.json'

/**
 * OSS 凭证结构
 */
interface OssCredentials {
  region: string
  bucket: string
  accessKeyId: string
  accessKeySecret: string
}

/**
 * 从 .env.local 加载 OSS 凭证
 */
function loadOssCredentials(): OssCredentials {
  const envPath = path.resolve(ENV_LOCAL_PATH)

  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local 文件不存在: ${envPath}`)
  }

  const content = fs.readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.substring(0, eqIndex).trim()
    let value = trimmed.substring(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key) env[key] = value
  }

  const region = env.OSS_REGION
  const bucket = env.OSS_BUCKET
  const accessKeyId = env.OSS_ACCESS_KEY_ID
  const accessKeySecret = env.OSS_ACCESS_KEY_SECRET

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    throw new Error('.env.local 中缺少 OSS 凭证配置（OSS_REGION / OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET）')
  }

  return { region, bucket, accessKeyId, accessKeySecret }
}

/**
 * 版本号字符串解析为三段数字
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(Number)
  return {
    major: !isNaN(parts[0]) ? parts[0] : 0,
    minor: !isNaN(parts[1]) ? parts[1] : 0,
    patch: !isNaN(parts[2]) ? parts[2] : 0,
  }
}

/**
 * 语义化版本号转为 Android versionCode
 * 格式：major * 10000 + minor * 100 + patch
 */
function versionToCode(version: string): number {
  const { major, minor, patch } = parseVersion(version)
  return major * 10000 + minor * 100 + patch
}

/**
 * 更新 Android build.gradle.kts 中的版本号
 */
function updateBuildGradle(versionName: string, versionCode: number): void {
  const gradlePath = path.resolve(ANDROID_PROJECT_PATH, 'app/build.gradle.kts')

  if (!fs.existsSync(gradlePath)) {
    throw new Error(`build.gradle.kts 文件不存在: ${gradlePath}`)
  }

  let content = fs.readFileSync(gradlePath, 'utf-8')

  // 更新 versionCode
  content = content.replace(/versionCode\s*=\s*\d+/, `versionCode = ${versionCode}`)

  // 更新 versionName
  content = content.replace(/versionName\s*=\s*"[^"]*"/, `versionName = "${versionName}"`)

  fs.writeFileSync(gradlePath, content, 'utf-8')
}

/**
 * 通过 HTTPS PUT 上传文件到阿里云 OSS（使用 V2 签名）
 */
function uploadToOss(
  filePath: string,
  credentials: OssCredentials,
  ossPath: string,
  contentType: string,
): Promise<void> {
  const { region, bucket, accessKeyId, accessKeySecret } = credentials

  const fileBuffer = fs.readFileSync(filePath)
  const fileSize = fileBuffer.length
  const contentMd5 = createHash('md5').update(fileBuffer).digest('base64')

  const host = `${bucket}.${region}.aliyuncs.com`
  const date = new Date().toUTCString()

  const canonicalizedResource = `/${bucket}/${ossPath}`
  const canonicalizedOssHeaders = `x-oss-object-acl:public-read\n`
  const stringToSign = `PUT\n${contentMd5}\n${contentType}\n${date}\n${canonicalizedOssHeaders}${canonicalizedResource}`

  const signature = createHmac('sha1', accessKeySecret).update(stringToSign).digest('base64')
  const authorization = `OSS ${accessKeyId}:${signature}`

  return new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        method: 'PUT',
        hostname: host,
        path: `/${ossPath}`,
        headers: {
          'Content-Length': String(fileSize),
          'Content-Type': contentType,
          'Content-MD5': contentMd5,
          Host: host,
          Date: date,
          Authorization: authorization,
          'x-oss-object-acl': 'public-read',
        },
      },
      (res) => {
        let body = ''
        res.on('data', (chunk: Buffer) => { body += chunk.toString() })
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            reject(new Error(`OSS 上传失败，HTTP ${res.statusCode}: ${body}`))
          }
        })
      },
    )

    req.on('error', (err: Error) => {
      reject(new Error(`OSS 上传网络错误: ${err.message}`))
    })

    req.write(fileBuffer)
    req.end()
  })
}

/**
 * Android 项目发布流程 Hook
 */
export function useAndroidPublish() {
  const api = window.electronAPI

  // ── 状态 ──
  const currentTask = ref<PublishTask | null>(null)
  const isPublishing = ref(false)

  // ── 日志辅助 ──
  const addLog = (task: PublishTask, level: LogEntry['level'], message: string) => {
    task.logs.push({ timestamp: Date.now(), level, message })
  }

  const setStatus = (task: PublishTask, status: BuildStatus) => {
    task.status = status
  }

  // ── 实时日志监听 ──
  let listenerRegistered = false

  function ensureListener() {
    if (listenerRegistered) return
    api.onCommandOutput(onOutput)
    listenerRegistered = true
  }

  function onOutput(data: { taskId: string; type: 'stdout' | 'stderr'; data: string }) {
    const task = currentTask.value
    if (!task || data.taskId !== task.id) return
    const lines = data.data.split('\n').filter((l) => l.trim())
    for (const line of lines) {
      const level: LogEntry['level'] = data.type === 'stderr' ? 'warn' : 'info'
      const trimmed = line.trim()
      if (trimmed) {
        addLog(task, level, trimmed)
      }
    }
  }

  function removeListener() {
    if (listenerRegistered) {
      api.removeCommandOutputListener()
      listenerRegistered = false
    }
  }

  // ── 核心流程 ──

  /**
   * 启动 Android 发布任务
   *
   * 执行完整流程：
   * 1. 更新版本清单 versionManifest.json
   * 2. 更新 build.gradle.kts 中的 versionCode / versionName
   * 3. 执行 gradlew assembleRelease 构建 APK
   * 4. 压缩 APK 为 zip 并上传到 OSS
   * 5. 上传版本清单到 OSS
   */
  async function startPublish(task: PublishTask): Promise<void> {
    currentTask.value = task
    isPublishing.value = true
    ensureListener()

    const project = getProjectById(task.projectId)
    if (!project) {
      throw new Error(`未找到项目配置: ${task.projectId}`)
    }

    const projectPath = path.resolve(project.path)
    const versionCode = versionToCode(task.version)

    addLog(task, 'info', `🚀 开始发布 Android MyHome - v${task.version} (code: ${versionCode})`)

    try {
      // ── 步骤 1：更新版本清单 ──
      addLog(task, 'info', `📋 更新版本清单...`)
      try {
        const manifestRaw = await api.readFile(VERSION_MANIFEST_PATH)
        const manifest = JSON.parse(manifestRaw)
        if (!manifest.android) manifest.android = {}
        manifest.android.MyHome = task.version
        await api.writeFile(VERSION_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
        addLog(task, 'info', `✅ 版本清单已更新: android.MyHome → ${task.version}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`更新版本清单失败: ${msg}`)
      }

      task.progress = 10

      // ── 步骤 2：更新 build.gradle.kts 版本号 ──
      addLog(task, 'info', `📋 更新 build.gradle.kts versionName=${task.version} versionCode=${versionCode}...`)
      try {
        const gradlePath = path.resolve(projectPath, 'app/build.gradle.kts')
        let gradleContent = await api.readFile(gradlePath)
        gradleContent = gradleContent.replace(/versionCode\s*=\s*\d+/, `versionCode = ${versionCode}`)
        gradleContent = gradleContent.replace(/versionName\s*=\s*"[^"]*"/, `versionName = "${task.version}"`)
        await api.writeFile(gradlePath, gradleContent)
        addLog(task, 'info', `✅ build.gradle.kts 版本号已更新`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`更新 build.gradle.kts 失败: ${msg}`)
      }

      task.progress = 20

      // ── 步骤 3：构建 APK ──
      addLog(task, 'info', '🔧 开始构建 Android APK...')
      addLog(task, 'info', `📂 工作目录: ${projectPath}`)
      setStatus(task, 'publishing')
      task.progress = 25

      const buildResult = await api.spawnCommand('./gradlew assembleRelease', projectPath, task.id)

      if (buildResult.code !== 0) {
        throw new Error(`构建失败，退出码: ${buildResult.code}`)
      }
      addLog(task, 'info', '✅ APK 构建完成')

      task.progress = 60

      // ── 步骤 4：读取 OSS 凭证并上传 APK ──
      addLog(task, 'info', '🚀 开始上传 APK 到 OSS...')
      task.progress = 65

      let credentials: OssCredentials
      try {
        credentials = loadOssCredentials()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`加载 OSS 凭证失败: ${msg}`)
      }

      // 构建 APK 输出路径
      const apkPath = path.resolve(projectPath, 'app/build/outputs/apk/release/app-release.apk')

      if (!fs.existsSync(apkPath)) {
        throw new Error(`APK 文件不存在: ${apkPath}`)
      }

      const apkSize = fs.statSync(apkPath).size
      addLog(task, 'info', `📦 APK 文件大小: ${(apkSize / (1024 * 1024)).toFixed(2)} MB`)

      // 上传 APK 到 OSS
      await uploadToOss(apkPath, credentials, OSS_ANDROID_UPLOAD_PATH, 'application/zip')
      addLog(task, 'info', `✅ APK 已上传: ${OSS_ANDROID_UPLOAD_PATH}`)

      task.progress = 85

      // ── 步骤 5：上传版本清单到 OSS ──
      addLog(task, 'info', '📋 上传版本清单到 OSS...')
      const manifestFullPath = path.resolve(VERSION_MANIFEST_PATH)

      if (!fs.existsSync(manifestFullPath)) {
        addLog(task, 'warn', '⚠️ 版本清单文件不存在，跳过上传')
      } else {
        await uploadToOss(manifestFullPath, credentials, OSS_MANIFEST_PATH, 'application/json')
        addLog(task, 'info', `✅ 版本清单已上传: ${OSS_MANIFEST_PATH}`)
      }

      // ── 完成 ──
      task.progress = 100
      setStatus(task, 'success')
      addLog(task, 'info', '🎉 Android MyHome 发布成功')
      ElMessage.success('Android 项目发布成功')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      addLog(task, 'error', `❌ ${msg}`)
      setStatus(task, 'failed')
      throw err
    } finally {
      task.endTime = Date.now()
      isPublishing.value = false
    }
  }

  /**
   * 取消当前发布任务
   */
  function cancelPublish() {
    if (currentTask.value) {
      addLog(currentTask.value, 'warn', '⚠️ 发布已被用户取消')
      setStatus(currentTask.value, 'failed')
      isPublishing.value = false
      removeListener()
    }
  }

  /**
   * 清空当前任务日志
   */
  function clearLogs() {
    if (currentTask.value) {
      currentTask.value.logs = []
    }
  }

  // ── 组件卸载时清理 ──
  onUnmounted(() => {
    removeListener()
  })

  return {
    currentTask,
    isPublishing,
    startPublish,
    cancelPublish,
    clearLogs,
  }
}
