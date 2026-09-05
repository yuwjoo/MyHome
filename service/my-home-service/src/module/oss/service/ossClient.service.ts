import { Inject, Injectable } from '@nestjs/common';
import OSS, { STS } from 'ali-oss';
import aliyunConfig, { AliyunConfig } from 'src/config/aliyun.config';
import {
  OssTempCredentials,
  SignDownloadUrlOptions,
  SignUploadUrlOptions,
} from '../types/service.type';

@Injectable()
export class OssClientService {
  private ossClient: OSS; // oss客户端实例
  private stsClient: STS; // sts客户端实例
  private cacheOssTempCredentials: OssTempCredentials; // 缓存的oss临时访问凭证

  constructor(
    @Inject(aliyunConfig.KEY)
    private readonly aliyunConfig: AliyunConfig,
  ) {}

  /**
   * 获取oss客户端
   * @return {Promise<OSS>} oss客户端实例
   */
  async getOssClient(): Promise<OSS> {
    if (this.ossClient) return this.ossClient;

    const credentials = await this.fetchOssTempCredentials();

    this.ossClient = new OSS({
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      refreshSTSToken: async () => {
        const credentials = await this.fetchOssTempCredentials();
        return {
          accessKeyId: credentials.AccessKeyId,
          accessKeySecret: credentials.AccessKeySecret,
          stsToken: credentials.SecurityToken,
        };
      },
      refreshSTSTokenInterval: credentials.ExpireSecond * 1000,
      region: this.aliyunConfig.oss.region,
      bucket: this.aliyunConfig.oss.bucket,
      endpoint: this.aliyunConfig.oss.endpoint,
      authorizationV4: true,
    } as any);

    return this.ossClient;
  }

  /**
   * 获取sts客户端
   * @return {STS} sts客户端实例
   */
  getStsClient(): STS {
    if (this.stsClient) return this.stsClient;

    const accessKeyId = this.aliyunConfig.sts.accessKeyId;
    const accessKeySecret = this.aliyunConfig.sts.accessKeySecret;

    // 创建STS客户端
    this.stsClient = new STS({ accessKeyId, accessKeySecret });

    return this.stsClient;
  }

  /**
   * 请求oss临时访问凭证
   * @return {Promise<OssTempCredentials>} 临时访问凭证
   */
  async fetchOssTempCredentials(): Promise<OssTempCredentials> {
    if (
      this.cacheOssTempCredentials &&
      new Date(this.cacheOssTempCredentials.Expiration).getTime() - Date.now() >
        5 * 60 * 1000
    ) {
      return this.cacheOssTempCredentials;
    }

    const expireSecond = this.aliyunConfig.sts.expireSecond;
    const roleArn = this.aliyunConfig.sts.roleArn;
    const { credentials } = await this.getStsClient().assumeRole(
      roleArn,
      undefined,
      expireSecond,
    );
    this.cacheOssTempCredentials = {
      ...credentials,
      ExpireSecond: expireSecond,
    };

    return this.cacheOssTempCredentials;
  }

  /**
   * 签名上传url
   * @param {SignUploadUrlOptions} options 配置
   * @return {Promise<string>} 上传url
   */
  async signUploadUrl(options: SignUploadUrlOptions): Promise<string> {
    const ossClient = await this.getOssClient();
    const expire = this.aliyunConfig.oss.uploadSignExpireSecond; // 签名url过期时间
    const generateQueries = (
      hash: string,
      mimeType: string,
    ): Record<string, any> => {
      return {
        callback: btoa(
          JSON.stringify({
            callbackUrl: `${this.aliyunConfig.oss.uploadCbServerUrl}/api/oss/uploadCallback`,
            callbackBody:
              '{ \"hash\":${x:hash}, \"bucket\":${bucket}, \"object\":${object}, \"size\":${size}, \"mimeType\":${x:mimeType}, \"etag\":${etag}, \"imageInfo\":${imageInfo} }',
            callbackBodyType: 'application/json',
          }),
        ),
        'callback-var': btoa(
          JSON.stringify({
            'x:hash': hash,
            'x:mimeType': mimeType,
          }),
        ),
      };
    };

    return (ossClient as any).signatureUrlV4(
      'PUT',
      expire,
      {
        headers: {
          'Content-Type': options.mimeType,
          ...(options.extraHeaders || {}),
        },
        queries: generateQueries(options.hash, options.mimeType),
      },
      options.object,
    );
  }

  /**
   * 签名下载url
   * @param {SignDownloadUrlOptions} options 配置
   * @return {Promise<string>} 上传url
   */
  async signDownloadUrl(options: SignDownloadUrlOptions): Promise<string> {
    const ossClient = await this.getOssClient();
    const expire =
      options.expire ?? this.aliyunConfig.oss.downloadSignExpireSecond; // 签名url过期时间
    const httpCacheExpire = options.httpCacheExpire ?? 30 * 24 * 60 * 60; // http缓存过期时间
    // attachment 用于下载；inline 用于 <video>/<img> 内联播放（attachment 会阻止媒体元素渲染）
    const disposition = options.disposition ?? 'attachment';
    const contentDisposition =
      disposition === 'inline'
        ? 'inline'
        : `attachment; filename=${encodeURIComponent(options.filename)}`;
    const generateQueries = (
      httpCacheExpire: number,
    ): Record<string, any> => {
      return {
        'response-cache-control': `private, max-age=${httpCacheExpire}`,
        'response-content-disposition': contentDisposition,
      };
    };

    return (ossClient as any).signatureUrlV4(
      'GET',
      expire,
      {
        headers: {},
        queries: {
          ...options.extraQueries,
          ...generateQueries(httpCacheExpire),
        },
      },
      options.object,
    );
  }
}
