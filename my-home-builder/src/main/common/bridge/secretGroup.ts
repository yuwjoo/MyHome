/**
 * 凭证推送/拉取消息处理器
 * 处理 .secret 目录的压缩上传与下载还原
 */
import * as path from "node:path";
import { mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { zip } from "compressing";
import type { MessageHandler } from "../../module/bridge/dispatcher";
import ossClient from "../../module/oss";
import { releaseConfig } from "../../config/releaseConfig";

const { localAssets, ossAssets } = releaseConfig;

export const secretGroup: Record<string, MessageHandler> = {
  /**
   * 推送 .secret 目录到 OSS
   *
   * 流程：压缩 → 上传 OSS（私有权限）
   *
   * @param _params 无参数
   * @param sender  消息发送器
   *   - 进度回调: onProgress({ step: string })
   *   - 成功回调: onSuccess({ url: string })
   *   - 失败回调: onError({ message: string })
   */
  pushSecret: async (_params, sender) => {
    const sourceDir = localAssets.secret;
    const tempZip = path.join(tmpdir(), `secret-${randomUUID()}.zip`);

    try {
      sender.send("onProgress", { step: "压缩 .secret 目录" }, false);
      await zip.compressDir(sourceDir, tempZip, { ignoreBase: true });

      sender.send("onProgress", { step: "上传 OSS" }, false);
      const buffer = await readFile(tempZip);
      const result = await ossClient.put(ossAssets.secret, buffer, {
        headers: { "x-oss-object-acl": "private" },
      });

      await rm(tempZip).catch(() => {});

      sender.sendEndMessage("onSuccess", { url: result.url });
    } catch (err) {
      await rm(tempZip).catch(() => {});
      sender.sendEndMessage("onError", { message: (err as Error).message });
    }
  },

  /**
   * 从 OSS 下拉并还原 .secret 目录
   *
   * 流程：下载 zip → 解压到目标目录
   *
   * @param params.targetDir 目标目录（可选，默认使用 releaseConfig 配置的路径）
   * @param sender           消息发送器
   *   - 进度回调: onProgress({ step: string })
   *   - 成功回调: onSuccess({ targetDir: string })
   *   - 失败回调: onError({ message: string })
   */
  pullSecret: async (params, sender) => {
    const targetDir = (params.targetDir as string) || localAssets.secret;
    const tempZip = path.join(tmpdir(), `secret-${randomUUID()}.zip`);

    try {
      sender.send("onProgress", { step: "下载凭证文件" }, false);
      const result = await ossClient.get(ossAssets.secret);
      const buffer = Buffer.from(result.content as Buffer);
      await writeFile(tempZip, buffer);

      sender.send("onProgress", { step: "解压还原 .secret 目录" }, false);
      await rm(targetDir, { recursive: true, force: true }).catch(() => {});
      await mkdir(targetDir, { recursive: true });
      await zip.uncompress(tempZip, targetDir);

      await rm(tempZip).catch(() => {});

      sender.sendEndMessage("onSuccess", { targetDir });
    } catch (err) {
      await rm(tempZip).catch(() => {});
      sender.sendEndMessage("onError", { message: (err as Error).message });
    }
  },
};
