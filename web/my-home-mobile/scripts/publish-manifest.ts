/**
 * 版本清单发布脚本：仅上传 versionManifest.json 到 OSS
 *
 * 使用方式：
 *   npm run publish:manifest
 *
 * 与 publish.ts 共享相同的 .env.local 配置。
 */

import {
  existsSync,
  readFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { createHash, createHmac } from 'node:crypto'
import * as https from 'node:https'

// ==================== 工具函数 ====================

function getProjectRoot(): string {
  return process.cwd()
}

function loadEnvFromLocalFile(): void {
  const envPath = resolve(getProjectRoot(), '.env.local')
  if (!existsSync(envPath)) {
    console.warn('[publish:manifest] .env.local 文件不存在，将使用系统环境变量')
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
    let value = trimmed.substring(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
  console.log('[publish:manifest] 已从 .env.local 加载环境变量')
}

function getOssCredentials() {
  const region = process.env.OSS_REGION
  const bucket = process.env.OSS_BUCKET
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
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

  return { region, bucket, accessKeyId, accessKeySecret, manifestPath }
}

// ==================== OSS 上传 ====================

async function uploadToOss(
  filePath: string,
  credentials: ReturnType<typeof getOssCredentials>,
  uploadPath: string,
  contentType = 'application/json',
): Promise<void> {
  const { region, bucket, accessKeyId, accessKeySecret } = credentials

  const fileBuffer = readFileSync(filePath)
  const fileSize = fileBuffer.length
  const contentMd5 = createHash('md5').update(fileBuffer).digest('base64')

  const host = `${bucket}.${region}.aliyuncs.com`
  const date = new Date().toUTCString()

  const canonicalizedResource = `/${bucket}/${uploadPath}`
  const aclHeaderKey = 'x-oss-object-acl'
  const aclHeaderValue = 'public-read'
  const canonicalizedOssHeaders = `${aclHeaderKey}:${aclHeaderValue}\n`
  const stringToSign = `PUT\n${contentMd5}\n${contentType}\n${date}\n${canonicalizedOssHeaders}${canonicalizedResource}`

  const signature = createHmac('sha1', accessKeySecret)
    .update(stringToSign)
    .digest('base64')

  const authorization = `OSS ${accessKeyId}:${signature}`

  console.log(`[publish:manifest] 上传目标: https://${host}/${uploadPath}`)

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
            console.log('[publish:manifest] 版本清单发布成功！')
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
  console.log('[publish:manifest] 开始发布版本清单')
  console.log('='.repeat(50))

  loadEnvFromLocalFile()

  let credentials: ReturnType<typeof getOssCredentials>
  try {
    credentials = getOssCredentials()
  } catch (error) {
    console.error(`[publish:manifest] ${(error as Error).message}`)
    process.exit(1)
  }

  const manifestFile = resolve(getProjectRoot(), '..', '..', 'versionManifest.json')
  if (!existsSync(manifestFile)) {
    console.error('[publish:manifest] versionManifest.json 不存在')
    process.exit(1)
  }

  await uploadToOss(manifestFile, credentials, credentials.manifestPath)

  console.log('='.repeat(50))
  console.log('[publish:manifest] 版本清单发布完成！')
  console.log('='.repeat(50))
}

main().catch((error) => {
  console.error('[publish:manifest] 发布失败:', error.message)
  process.exit(1)
})
