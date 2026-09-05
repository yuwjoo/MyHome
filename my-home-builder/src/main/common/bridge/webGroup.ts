/**
 * Web 项目发布消息处理器
 * 处理各 Web 项目的版本更新、构建、打包与 OSS 上传
 *
 * 项目间差异仅在于：项目根目录、构建产物目录、OSS 上传 key，
 * 因此统一收敛为 publishWeb() 一处实现；
 * 新增 Web 项目时只需在 webTargets 追加配置并注册对应消息处理即可。
 */
import * as path from "node:path";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { zip } from 'compressing';
import type { MessageHandler } from "../../module/bridge/dispatcher";
import ossClient from "../../module/oss";
import { releaseConfig } from "../../config/releaseConfig";
import type { MessageSender } from "@/main/module/bridge/messageSender";

const { localAssets, ossAssets } = releaseConfig;

/** Web 发布目标配置 */
interface WebPublishTarget {
  /** 项目名（用于日志与错误提示） */
  name: string;
  /** 项目根目录（含 package.json） */
  projectRoot: string;
  /** 构建产物目录（dist） */
  distPath: string;
  /** OSS 对象 key */
  ossKey: string;
}

/** 受支持的 Web 发布目标集合 */
const webTargets: Record<string, WebPublishTarget> = {
  /** MyHome 移动端 */
  myHomeMobile: {
    name: "my-home-mobile",
    projectRoot: path.dirname(localAssets.web),
    distPath: localAssets.web,
    ossKey: ossAssets.web,
  },
  /** 菜谱移动端 */
  myHomeRecipe: {
    name: "my-home-recipe",
    projectRoot: path.dirname(localAssets.recipeWeb),
    distPath: localAssets.recipeWeb,
    ossKey: ossAssets.recipeWeb,
  },
};

/**
 * 更新 package.json 中的版本号
 *
 * @param projectRoot 项目根目录
 * @param version     新版本号
 */
async function updatePackageVersion(projectRoot: string, version: string): Promise<void> {
  const pkgPath = path.resolve(projectRoot, "package.json");
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
function compressToZip(sourcePath: string, outputPath: string): Promise<void> {
  return zip.compressDir(sourcePath, outputPath, { ignoreBase: true });
}

/**
 * 执行 npm run build 并流式输出构建日志
 *
 * @param projectRoot 项目根目录
 * @param sender      消息发送器
 */
function runBuild(projectRoot: string, sender: MessageSender): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: projectRoot,
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

/**
 * 执行完整的 Web 项目发布流程
 *
 * @param target 发布目标配置
 * @param params.version 最新版本号
 * @param sender         消息发送器
 *   - 进度回调: onProgress({ step: string; ... })
 *   - 构建输出: onBuildOutput({ data: string })  可能多次
 *   - 成功回调: onSuccess({ url: string; version: string })
 *   - 失败回调: onError({ message: string })
 */
async function publishWeb(
  target: WebPublishTarget,
  params: Record<string, unknown>,
  sender: MessageSender,
): Promise<void> {
  const version = params.version as string | undefined;
  if (!version) {
    sender.sendEndMessage("onError", { message: "参数 version 缺失" });
    return;
  }

  const zipPath = path.resolve(target.projectRoot, "release.zip");

  try {
    // 1. 更新版本号
    sender.send("onProgress", { step: "更新版本号", version }, false);
    await updatePackageVersion(target.projectRoot, version);

    // 2. 执行构建
    sender.send("onProgress", { step: "执行构建" }, false);
    await runBuild(target.projectRoot, sender);

    // 3. 压缩 dist
    sender.send("onProgress", { step: "压缩打包" }, false);
    await compressToZip(target.distPath, zipPath);

    // 4. 上传 OSS
    sender.send("onProgress", { step: "上传 OSS" }, false);
    const buffer = await readFile(zipPath);
    const result = await ossClient.put(target.ossKey, buffer, {
      headers: { 'x-oss-object-acl': 'public-read' },
    });

    // 清理临时 zip（清理失败不影响发布结果）
    await unlink(zipPath).catch(() => undefined);

    sender.sendEndMessage("onSuccess", { url: result.url, version });
  } catch (err) {
    // 清理临时文件（清理失败不影响错误上报）
    await unlink(zipPath).catch(() => undefined);
    sender.sendEndMessage("onError", { message: (err as Error).message });
  }
}

export const webGroup: Record<string, MessageHandler> = {
  /**
   * 发布 my-home-mobile 项目
   */
  publishMyHomeMobile: async (params, sender) => {
    await publishWeb(webTargets.myHomeMobile, params, sender);
  },

  /**
   * 发布 my-home-recipe（菜谱）项目
   */
  publishMyHomeRecipe: async (params, sender) => {
    await publishWeb(webTargets.myHomeRecipe, params, sender);
  },
};
