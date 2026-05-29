import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secretKey: string; // 加密密钥
  expirationTime: number; // 过期时间
}

/**
 * jwt配置
 */
export default registerAs('jwt', (): JwtConfig => {
  return {
    secretKey: process.env.JWT_SECRET || '',
    expirationTime: 24 * 60 * 60,
  };
});
