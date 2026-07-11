/**
 * Vite 插件：打包时自动生成 metadata.json 并同步更新 versionManifest.json
 *
 * 在 vite build 完成后：
 * 1. 读取 package.json 中的 version 字段
 * 2. 生成 metadata.json 文件到 dist 目录
 * 3. 同步更新项目根目录的 versionManifest.json 中 my-home-mobile 的版本号
 *
 * metadata.json 格式: { "version": "0.0.1" }
 *
 * 使用方式：
 *   在 vite.config.ts 中导入并添加到 plugins 数组即可。
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 获取项目根目录（vite 项目目录）
 */
function getProjectRoot(): string {
  return process.cwd()
}

/**
 * 读取 package.json 中的版本号
 */
function getPackageVersion(packageJsonPath?: string): string | null {
  const pkgPath = packageJsonPath ?? resolve(getProjectRoot(), 'package.json')
  const pkgContent = readFileSync(pkgPath, 'utf-8')
  const pkg = JSON.parse(pkgContent) as { version?: string }
  return pkg.version ?? null
}

/**
 * 生成 dist/metadata.json
 */
function generateMetadataFile(version: string): void {
  const distDir = resolve(getProjectRoot(), 'dist')
  const metadataPath = resolve(distDir, 'metadata.json')
  const metadata = { version }
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
  console.log(`[generate-metadata] 已生成 metadata.json，版本: ${version}`)
}

import type { Plugin } from 'vite'

/**
 * 生成 metadata.json 并同步 versionManifest.json 的 Vite 插件
 *
 * @param packageJsonPath - package.json 文件路径（默认为项目根目录）
 * @returns Vite Plugin 实例
 */
export function generateMetadataPlugin(packageJsonPath?: string): Plugin {
  return {
    name: 'generate-metadata',
    apply: 'build', // 仅在构建模式下生效

    /**
     * 在 bundle 写入完成后生成 metadata.json 并同步 versionManifest.json
     */
    writeBundle() {
      try {
        const version = getPackageVersion(packageJsonPath)

        if (!version) {
          console.warn('[generate-metadata] package.json 中未找到 version 字段')
          return
        }

        // 1. 生成 dist/metadata.json
        generateMetadataFile(version)
      } catch (error) {
        console.error('[generate-metadata] 生成失败:', error)
      }
    },
  }
}
