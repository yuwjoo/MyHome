/**
 * 用户信息
 */
export interface UserInfo {
  userAccount: string;
  userName: string;
  avatarUrl?: string | undefined;
}

/**
 * sts信息
 */
export interface STSInfo {
  accessKeyId: string; // 临时访问密钥ID
  accessKeySecret: string; // 临时访问密钥Secret
  stsToken: string; // 安全令牌
  expiration: string; // 过期时间
  expireSecond: number; // 过期秒数
  bucket: string; // buket名称
  region: string; // buket地域
  endpoint: string; // 公网endpoint
  rootDir: string; // 根目录路径
}

/**
 * 登录请求参数
 */
export type LoginParams = {
  username: string; // 用户名
  password: string; // 密码
};

/**
 * 登录响应结果
 */
export type LoginResponse = {
  user: UserInfo; // 用户信息
  accessToken: string; // 访问令牌
  stsInfo: STSInfo; // sts信息
};

/**
 * 注册请求参数
 */
export type RegisterParams = {
  username: string; // 用户名
  nickname?: string; // 昵称
  password: string; // 密码
  avatar?: string; // 头像
};
