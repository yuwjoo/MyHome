/**
 * 版本清单消息处理器
 * 处理版本清单的读取与发布
 */
import { readFile, writeFile } from "node:fs/promises";
import type { MessageHandler } from "../../module/bridge/dispatcher";
import ossClient from "../../module/oss";
import { releaseConfig } from "../../config/releaseConfig";

const { localAssets, ossAssets } = releaseConfig;

export const versionManifestGroup: Record<string, MessageHandler> = {
  /**
   * 获取版本清单数据
   *
   * @param _params 无
   * @param sender  消息发送器，成功后回调 onSuccess({ manifest: object })，失败回调 onError({ message: string })
   */
  getManifest: async (_params, sender) => {
    try {
      const content = await readFile(localAssets.manifest, "utf-8");
      sender.sendEndMessage("onSuccess", { manifest: JSON.parse(content) });
    } catch (err) {
      sender.sendEndMessage("onError", { message: (err as Error).message });
    }
  },

  /**
   * 发布版本清单到 OSS
   *
   * @param params.manifest 版本清单 JSON 数据，会先覆盖到本地文件
   * @param sender          消息发送器，成功后回调 onSuccess({ url: string })，失败回调 onError({ message: string })
   */
  publishManifest: async (params, sender) => {
    const manifest = params.manifest as object | undefined;
    if (!manifest) {
      sender.sendEndMessage("onError", { message: "参数 manifest 缺失" });
      return;
    }

    try {
      // 覆盖本地版本清单文件
      await writeFile(
        localAssets.manifest,
        JSON.stringify(manifest, null, 2),
        "utf-8",
      );

      // 上传到 OSS
      const buffer = await readFile(localAssets.manifest);
      const result = await ossClient.put(ossAssets.manifest, buffer, {
        headers: { "x-oss-object-acl": "public-read" },
      });
      sender.sendEndMessage("onSuccess", { url: result.url });
    } catch (err) {
      sender.sendEndMessage("onError", { message: (err as Error).message });
    }
  },
};
