/**
 * Web 项目发布消息处理器
 * 处理 my-home-mobile 项目的版本更新、构建、打包与 OSS 上传
 */
import * as path from "node:path";
import { createWriteStream } from "node:fs";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { ZipArchive } from 'archiver';
import type { MessageHandler } from "../../module/bridge/dispatcher";
import ossClient from "../../module/oss";
import { releaseConfig } from "../../config/releaseConfig";
import type { MessageSender } from "@/main/module/bridge/messageSender";

const { localAssets, ossAssets } = releaseConfig;

/** Web 项目根目录 */
const webProjectRoot = path.dirname(localAssets.web);

/**
 * 更新 package.json 中的版本号
 *
 * @param version 新版本号
 */
async function updatePackageVersion(version: string): Promise<void> {
  const pkgPath = path.resolve(webProjectRoot, "package.json");
  const content = await readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(content);
  pkg.version = version;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
}

/**
 * 压缩目录为 zip
 *
 * @param sourcePath 要压缩的目录
 * @param outputPath zip 输出路径
 */
function compressToZip(
  sourcePath: string,
  outputPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => resolve(outputPath));
    archive.on("error", (err: Error) => reject(err));

    archive.pipe(output);
    archive.directory(sourcePath, false);
    archive.finalize();
  });
}

/**
 * 执行 npm run build 并流式输出构建日志
 *
 * @param sender 消息发送器
 */
function runBuild(sender: MessageSender): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: webProjectRoot,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" },
    });

    child.stdout?.on("data", (data: Buffer) => {
      sender.send("onBuildOutput", { data: data.toString() }, false);
    });

    child.stderr?.on("data", (data: Buffer) => {
      sender.send("onBuildOutput", { data: data.toString() }, false);
    });

    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`构建失败，退出码: ${code}`));
      }
    });

    child.on("error", (err: Error) => {
      reject(err);
    });
  });
}

export const webGroup: Record<string, MessageHandler> = {
  /**
   * 发布 my-home-mobile 项目
   *
   * @param params.version 最新版本号
   * @param sender         消息发送器
   *   - 进度回调: onProgress({ step: string; ... })
   *   - 构建输出: onBuildOutput({ data: string })  可能多次
   *   - 成功回调: onSuccess({ url: string; version: string })
   *   - 失败回调: onError({ message: string })
   */
  publishMyHomeMobile: async (params, sender) => {
    const version = params.version as string | undefined;
    if (!version) {
      sender.sendEndMessage("onError", { message: "参数 version 缺失" });
      return;
    }

    const distPath = localAssets.web;
    const zipPath = path.resolve(webProjectRoot, "release.zip");

    try {
      // 1. 更新版本号
      sender.send("onProgress", { step: "更新版本号", version }, false);
      await updatePackageVersion(version);

      // 2. 执行构建
      sender.send("onProgress", { step: "执行构建" }, false);
      await runBuild(sender);

      // 3. 压缩 dist
      sender.send("onProgress", { step: "压缩打包" }, false);
      await compressToZip(distPath, zipPath);

      // 4. 上传 OSS
      sender.send("onProgress", { step: "上传 OSS" }, false);
      const buffer = await readFile(zipPath);
      const result = await ossClient.put(ossAssets.web, buffer, {
        headers: { 'x-oss-object-acl': 'public-read' },
      });

      // 清理临时 zip
      await unlink(zipPath).catch(() => {});

      sender.sendEndMessage("onSuccess", { url: result.url, version });
    } catch (err) {
      // 清理临时文件
      await unlink(zipPath).catch(() => {});
      sender.sendEndMessage("onError", { message: (err as Error).message });
    }
  },
};
