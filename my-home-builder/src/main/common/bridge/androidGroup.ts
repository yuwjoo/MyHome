/**
 * Android 项目发布消息处理器
 * 处理 MyHome Android 项目的版本更新、构建与 OSS 上传
 */
import * as path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import type { MessageHandler } from "../../module/bridge/dispatcher";
import ossClient from "../../module/oss";
import { releaseConfig } from "../../config/releaseConfig";
import type { MessageSender } from "@/main/module/bridge/messageSender";

const { localAssets, ossAssets } = releaseConfig;

/** Android 项目配置 */
const { projectDir, apkPath } = localAssets.android;

/** gradlew 脚本名 */
const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

/** Android Studio 自带 JDK（JBR）路径 */
const androidStudioJdkHome = "D:\\InstallSoftware\\Android\\Android Studio\\jbr";

/**
 * 更新 build.gradle.kts 中的版本号
 *
 * @param version     版本名称，如 "0.0.9"
 * @param versionCode 版本号，如 9
 */
async function updateGradleVersion(
  version: string,
  versionCode: number,
): Promise<void> {
  const gradlePath = path.resolve(projectDir, "app", "build.gradle.kts");
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
 * @param sender 消息发送器
 */
function runBuild(sender: MessageSender): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(gradlew, ["assembleRelease"], {
      cwd: projectDir,
      shell: true,
      env: { ...process.env, JAVA_HOME: androidStudioJdkHome, FORCE_COLOR: "1" },
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

export const androidGroup: Record<string, MessageHandler> = {
  /**
   * 发布 MyHome Android 项目
   *
   * @param params.version     最新版本名称，如 "0.0.9"
   * @param params.versionCode 最新版本号，如 9
   * @param sender             消息发送器
   *   - 进度回调: onProgress({ step: string; ... })
   *   - 构建输出: onBuildOutput({ data: string })  可能多次
   *   - 成功回调: onSuccess({ url: string; version: string; versionCode: number })
   *   - 失败回调: onError({ message: string })
   */
  publishMyHome: async (params, sender) => {
    const version = params.version as string | undefined;
    const versionCode = params.versionCode as number | undefined;

    if (!version) {
      sender.sendEndMessage("onError", { message: "参数 version 缺失" });
      return;
    }
    if (versionCode === undefined) {
      sender.sendEndMessage("onError", { message: "参数 versionCode 缺失" });
      return;
    }

    try {
      // 1. 更新版本号
      sender.send(
        "onProgress",
        { step: "更新版本号", version, versionCode },
        false,
      );
      await updateGradleVersion(version, versionCode);

      // 2. 执行构建
      sender.send("onProgress", { step: "执行构建" }, false);
      await runBuild(sender);

      // 3. 上传 OSS
      sender.send("onProgress", { step: "上传 OSS" }, false);
      const buffer = await readFile(apkPath);
      const result = await ossClient.put(ossAssets.android, buffer, {
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
  },
};
