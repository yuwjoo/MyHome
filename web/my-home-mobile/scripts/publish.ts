/**
 * 发布脚本：打包 dist 目录为 zip 并上传到 OSS
 *
 * 功能：
 * 1. 将 dist 目录压缩为 my-home-mobile.zip
 * 2. 上传到 OSS 指定路径
 *
 * OSS 凭证从 .env.local 文件中读取（已被 .gitignore 忽略，防止提交到 Git）：
 *   OSS_REGION            - OSS 区域（如 oss-cn-shenzhen）
 *   OSS_BUCKET            - OSS Bucket 名称
 *   OSS_ACCESS_KEY_ID     - 阿里云 AccessKey ID
 *   OSS_ACCESS_KEY_SECRET - 阿里云 AccessKey Secret
 *   OSS_UPLOAD_PATH       - OSS 上传路径（默认 MyHome/web/my-home-mobile.zip）
 *
 * 创建 .env.local 文件（不会被 Git 追踪），内容示例：
 *   OSS_REGION=oss-cn-shenzhen
 *   OSS_BUCKET=yuwjoo-private-cloud-storage
 *   OSS_ACCESS_KEY_ID=your_access_key_id
 *   OSS_ACCESS_KEY_SECRET=your_access_key_secret
 *
 * 使用方式：
 *   npm run publish
 */

import {
  existsSync,
  statSync,
  readFileSync,
  unlinkSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { createHash, createHmac } from 'node:crypto'
import * as https from 'node:https'

// ==================== 工具函数 ====================

/** 获取项目根目录 */
function getProjectRoot(): string {
  return process.cwd()
}

/**
 * 从 .env.local 文件加载环境变量
 *
 * 仅加载以 .local 结尾的环境变量文件，
 * 这些文件已被 .gitignore 忽略，不会意外提交到 Git。
 */
function loadEnvFromLocalFile(): void {
  const envPath = resolve(getProjectRoot(), '.env.local')

  if (!existsSync(envPath)) {
    console.warn('[publish] .env.local 文件不存在，将使用系统环境变量')
    return
  }

  const content = readFileSync(envPath, 'utf-8')
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.substring(0, eqIndex).trim()
    // 移除引号包裹
    let value = trimmed.substring(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // 仅设置尚未通过系统环境变量设置的值
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }

  console.log('[publish] 已从 .env.local 加载环境变量')
}

/** 获取并校验 OSS 凭证 */
function getOssCredentials() {
  const region = process.env.OSS_REGION
  const bucket = process.env.OSS_BUCKET
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  const uploadPath = process.env.OSS_UPLOAD_PATH || 'MyHome/web/my-home-mobile.zip'
  const manifestPath = process.env.OSS_MANIFEST_PATH || 'MyHome/versionManifest.json'

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    throw new Error(
      '缺少 OSS 环境变量。请在 .env.local 文件中配置以下变量：\n' +
        '  OSS_REGION=oss-cn-shenzhen\n' +
        '  OSS_BUCKET=yuwjoo-private-cloud-storage\n' +
        '  OSS_ACCESS_KEY_ID=xxx\n' +
        '  OSS_ACCESS_KEY_SECRET=xxx'
    )
  }

  return { region, bucket, accessKeyId, accessKeySecret, uploadPath, manifestPath }
}

// ==================== ZIP 压缩 ====================

/**
 * 将 dist 目录压缩为 zip 文件
 *
 * Windows 使用 PowerShell Compress-Archive，
 * macOS/Linux 使用 zip 命令。
 */
function createZipFile(sourceDir: string, outputPath: string): void {
  console.log(`[publish] 压缩 ${sourceDir} -> ${outputPath}`)

  // 删除已有的 zip 文件
  if (existsSync(outputPath)) {
    unlinkSync(outputPath)
  }

  if (process.platform === 'win32') {
    // 先 cd 到 dist 目录再压缩，确保 zip 内路径为相对路径，使用 / 分隔符
    execSync(
      `powershell -Command "cd '${sourceDir}'; Compress-Archive -Path * -DestinationPath '${outputPath}' -Force"`,
      { stdio: 'inherit' },
    )
  } else {
    const cwd = resolve(outputPath, '..')
    execSync(`zip -r "${outputPath}" .`, { cwd: sourceDir, stdio: 'inherit' })
  }

  const zipSize = statSync(outputPath).size
  console.log(`[publish] zip 文件大小: ${(zipSize / (1024 * 1024)).toFixed(2)} MB`)
}

// ==================== OSS 上传 ====================

/**
 * 上传文件到阿里云 OSS（公共读权限）
 *
 * 使用 OSS V2 签名算法（HMAC-SHA1），通过 HTTPS PUT 请求上传。
 * 参考文档: https://help.aliyun.com/document_detail/31951.html
 *
 * @param filePath      本地文件路径
 * @param credentials    OSS 凭证
 * @param uploadPath     OSS 目标路径（如 MyHome/web/my-home-mobile.zip）
 * @param contentType    MIME 类型（默认 application/zip）
 */
async function uploadToOss(
  filePath: string,
  credentials: ReturnType<typeof getOssCredentials>,
  uploadPath: string,
  contentType = 'application/zip',
): Promise<void> {
  const { region, bucket, accessKeyId, accessKeySecret } = credentials

  // 读取文件并计算 Content-MD5
  const fileBuffer = readFileSync(filePath)
  const fileSize = fileBuffer.length
  const contentMd5 = createHash('md5').update(fileBuffer).digest('base64')

  const host = `${bucket}.${region}.aliyuncs.com`
  const date = new Date().toUTCString()

  // 设置 ACL 为公共读
  const aclHeaderKey = 'x-oss-object-acl'
  const aclHeaderValue = 'public-read'

  // 构建 OSS 签名字符串
  // CanonicalizedResource = /{bucket}/{object}
  // 包含 x-oss-* 头的规范化头（按字典序排列）
  const canonicalizedResource = `/${bucket}/${uploadPath}`
  const canonicalizedOssHeaders = `${aclHeaderKey}:${aclHeaderValue}\n`
  const stringToSign = `PUT\n${contentMd5}\n${contentType}\n${date}\n${canonicalizedOssHeaders}${canonicalizedResource}`

  // HMAC-SHA1 签名
  const signature = createHmac('sha1', accessKeySecret)
    .update(stringToSign)
    .digest('base64')

  const authorization = `OSS ${accessKeyId}:${signature}`

  console.log(`[publish] 上传目标: https://${host}/${uploadPath}`)
  console.log(`[publish] 文件大小: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`)

  return new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        method: 'PUT',
        hostname: host,
        path: `/${uploadPath}`,
        headers: {
          'Content-Length': String(fileSize),
          'Content-Type': contentType,
          'Content-MD5': contentMd5,
          'Host': host,
          'Date': date,
          'Authorization': authorization,
          'x-oss-object-acl': 'public-read',
        },
      },
      (res) => {
        let body = ''
        res.on('data', (chunk: Buffer) => { body += chunk.toString() })
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('[publish] OSS 上传成功！')
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

// ==================== 主流程 ====================

async function main() {
  console.log('='.repeat(50))
  console.log('[publish] 开始发布流程')
  console.log('='.repeat(50))

  // 1. 加载 .env.local 环境变量
  loadEnvFromLocalFile()

  // 2. 获取 OSS 凭证
  let credentials: ReturnType<typeof getOssCredentials>
  try {
    credentials = getOssCredentials()
  } catch (error) {
    console.error(`[publish] ${(error as Error).message}`)
    process.exit(1)
  }

  // 3. 确认 dist 目录存在
  const distDir = resolve(getProjectRoot(), 'dist')
  if (!existsSync(distDir)) {
    console.error('[publish] dist 目录不存在，请先执行 npm run build')
    process.exit(1)
  }

  // 4. 压缩 dist 为 zip
  console.log('[publish] 开始压缩 dist 目录...')
  const zipOutputPath = resolve(getProjectRoot(), 'my-home-mobile.zip')
  createZipFile(distDir, zipOutputPath)

  try {
    // 5. 上传 zip 到 OSS
    console.log('[publish] 开始上传 zip 到 OSS...')
    await uploadToOss(zipOutputPath, credentials, credentials.uploadPath)

    // 6. 上传 versionManifest.json 到 OSS
    const manifestFile = resolve(getProjectRoot(), '..', '..', 'versionManifest.json')
    if (!existsSync(manifestFile)) {
      console.warn('[publish] versionManifest.json 不存在，跳过上传')
    } else {
      console.log('[publish] 开始上传 versionManifest.json 到 OSS...')
      await uploadToOss(manifestFile, credentials, credentials.manifestPath, 'application/json')
    }

    console.log('='.repeat(50))
    console.log('[publish] 发布完成！')
    console.log('='.repeat(50))
  } finally {
    // 无论成功或失败，清理压缩文件
    if (existsSync(zipOutputPath)) {
      unlinkSync(zipOutputPath)
      console.log('[publish] 已清理临时 zip 文件')
    }
  }
}

main().catch((error) => {
  console.error('[publish] 发布失败:', error.message)
  process.exit(1)
})
