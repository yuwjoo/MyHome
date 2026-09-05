/**
 * Android 项目发布消息处理器
 * 处理各 Android 项目的版本更新、构建与 OSS 上传
 *
 * 项目间差异仅在于：项目根目录、APK 产物路径、OSS 上传 key，
 * 因此统一收敛为 publishAndroid() 一处实现；
 * 新增 Android 项目时只需在 androidTargets 追加配置并注册对应消息处理即可。
 */
import * as path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import type { MessageHandler } from "../../module/bridge/dispatcher";
import ossClient from "../../module/oss";
import { releaseConfig } from "../../config/releaseConfig";
import type { MessageSender } from "@/main/module/bridge/messageSender";

const { localAssets, ossAssets } = releaseConfig;

/** Android 发布目标配置 */
interface AndroidPublishTarget {
  /** 项目名（用于日志与错误提示） */
  name: string;
  /** 项目根目录（含 settings.gradle.kts） */
  projectDir: string;
  /** 构建产物 APK 路径 */
  apkPath: string;
  /** Android Studio 自带 JDK（JBR）路径 */
  jdkHome: string;
  /** OSS 对象 key */
  ossKey: string;
}

/** 受支持的 Android 发布目标集合 */
const androidTargets: Record<string, AndroidPublishTarget> = {
  /** 智能家居 App */
  myHome: {
    name: "MyHome",
    ...localAssets.android,
    ossKey: ossAssets.android,
  },
  /** 菜谱 App */
  recipe: {
    name: "MyHomeRecipe",
    ...localAssets.androidRecipe,
    ossKey: ossAssets.androidRecipe,
  },
};

/** gradlew 脚本名 */
const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

/**
 * 语义化版本号（x.y.z）转为 Android versionCode
 */
function versionToCode(version: string): number {
  const parts = version.split(".").map(Number);
  const major = Number.isNaN(parts[0]) ? 0 : parts[0];
  const minor = Number.isNaN(parts[1]) ? 0 : parts[1];
  const patch = Number.isNaN(parts[2]) ? 0 : parts[2];
  return major * 10000 + minor * 100 + patch;
}

/**
 * 更新 build.gradle.kts 中的版本号
 *
 * @param target      发布目标配置
 * @param version     版本名称，如 "0.0.9"
 * @param versionCode 版本号，如 9
 */
async function updateGradleVersion(
  target: AndroidPublishTarget,
  version: string,
  versionCode: number,
): Promise<void> {
  const gradlePath = path.resolve(target.projectDir, "app", "build.gradle.kts");
  let content = await readFile(gradlePath, "utf-8");
  content = content.replace(
    /versionCode\s*=\s*\d+/,
    `versionCode = ${versionCode}`,
  );
  content = content.replace(
    /versionName\s*=\s*"[^"]*"/,
    `versionName = "${version}"`,
  );
  await writeFile(gradlePath, content, "utf-8");
}

/**
 * 执行 gradlew assembleRelease 并流式输出构建日志
 *
 * @param target 发布目标配置
 * @param sender 消息发送器
 */
function runBuild(target: AndroidPublishTarget, sender: MessageSender): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(gradlew, ["assembleRelease"], {
      cwd: target.projectDir,
      shell: true,
      env: { ...process.env, JAVA_HOME: target.jdkHome, FORCE_COLOR: "1" },
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
 * 执行完整的 Android 项目发布流程
 *
 * @param target         发布目标配置
 * @param params.version 最新版本名称，如 "0.0.9"（versionCode 由版本名称推导）
 * @param sender         消息发送器
 *   - 进度回调: onProgress({ step: string; version?: string; versionCode?: number })
 *   - 构建输出: onBuildOutput({ data: string })  可能多次
 *   - 成功回调: onSuccess({ url: string; version: string; versionCode: number })
 *   - 失败回调: onError({ message: string })
 */
async function publishAndroid(
  target: AndroidPublishTarget,
  params: Record<string, unknown>,
  sender: MessageSender,
): Promise<void> {
  const version = params.version as string | undefined;
  if (!version) {
    sender.sendEndMessage("onError", { message: "参数 version 缺失" });
    return;
  }
  const versionCode = versionToCode(version);

  try {
    // 1. 更新版本号
    sender.send(
      "onProgress",
      { step: "更新版本号", version, versionCode },
      false,
    );
    await updateGradleVersion(target, version, versionCode);

    // 2. 执行构建
    sender.send("onProgress", { step: "执行构建" }, false);
    await runBuild(target, sender);

    // 3. 上传 OSS
    sender.send("onProgress", { step: "上传 OSS" }, false);
    const buffer = await readFile(target.apkPath);
    const result = await ossClient.put(target.ossKey, buffer, {
      headers: { 'x-oss-object-acl': 'public-read' },
    });

    sender.sendEndMessage("onSuccess", {
      url: result.url,
      version,
      versionCode,
    });
  } catch (err) {
    sender.sendEndMessage("onError", { message: (err as Error).message });
  }
}

export const androidGroup: Record<string, MessageHandler> = {
  /**
   * 发布 MyHome Android 项目（智能家居 App）
   */
  publishMyHome: async (params, sender) => {
    await publishAndroid(androidTargets.myHome, params, sender);
  },

  /**
   * 发布 MyHomeRecipe Android 项目（菜谱 App）
   */
  publishMyHomeRecipe: async (params, sender) => {
    await publishAndroid(androidTargets.recipe, params, sender);
  },
};
