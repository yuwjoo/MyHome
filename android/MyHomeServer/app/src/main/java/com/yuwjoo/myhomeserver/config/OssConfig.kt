package com.yuwjoo.myhomeserver.config

/**
 * OSS 对象存储配置
 *
 * 与 MyHome 后端服务使用的 OSS 桶保持一致。
 * 直播 HLS 片段与 m3u8 播放列表均存入此桶。
 *
 * 注意：以下 AK/SK 为空占位，部署前请填入实际值。
 * 密钥获取方式：阿里云 RAM 控制台 → 用户 → 创建 AccessKey。
 */
object OssConfig {
    /** OSS 桶名 */
    const val BUCKET_NAME = "yuwjoo-private-cloud-storage"

    /** OSS 区域端点 */
    const val ENDPOINT = "https://oss-cn-shenzhen.aliyuncs.com"

    /** OSS 外网访问 endpoint（不含协议前缀，供 SDK 使用） */
    const val OSS_SDK_ENDPOINT = "oss-cn-shenzhen.aliyuncs.com"

    // ════════════════ 认证凭据 ════════════════

    /** 阿里云 AccessKey ID，部署前替换 */
    const val ACCESS_KEY_ID = ""

    /** 阿里云 AccessKey Secret，部署前替换 */
    const val ACCESS_KEY_SECRET = ""

    // ════════════════ 路径生成 ════════════════

    /** 直播文件在桶内的存储目录前缀 */
    const val LIVE_DIR_PREFIX = "live-recordings/"

    /**
     * 生成 OSS object key（不含 bucket）
     * 形如 live-recordings/{streamId}/segment_000001.ts
     */
    fun liveObjectKey(streamId: String, fileName: String): String =
        "$LIVE_DIR_PREFIX$streamId/$fileName"
}
