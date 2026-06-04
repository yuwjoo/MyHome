import { registerAs } from '@nestjs/config';

export interface AliyunConfig {
  sts: {
    accessKeyId: string; // sts临时访问密钥AccessKey ID
    accessKeySecret: string; // sts临时访问密钥AccessKey Secret
    roleArn: string; // 操作角色ARN
    expireSecond: number; // sts过期时长（秒）
  };
  oss: {
    bucket: string; // OSS Bucket名称
    region: string; // OSS所属地域
    endpoint: string; // OSS节点
    storageBaseDir: string; // 存储基础目录
    uploadSignExpireSecond: number; // 上传签名过期时间（秒）
    downloadSignExpireSecond: number; // 下载签名过期时间（秒）
    uploadCbServerUrl: string; // oss上传回调服务器地址
  };
}

/**
 * 阿里云配置
 */
export default registerAs('aliyun', (): AliyunConfig => {
  return {
    sts: {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
      roleArn: 'acs:ram::1254412660048748:role/myhomeossmanager',
      expireSecond: 3600,
    },
    oss: {
      bucket: 'yuwjoo-my-home',
      region: 'oss-cn-shenzhen',
      endpoint: 'https://oss-cn-shenzhen.aliyuncs.com',
      storageBaseDir: process.env.OSS_BASE_DIR || '',
      uploadSignExpireSecond: 10800,
      downloadSignExpireSecond: 60,
      uploadCbServerUrl: process.env.OSS_UPLOAD_CB_SERVER_URL || '',
    },
  };
});
