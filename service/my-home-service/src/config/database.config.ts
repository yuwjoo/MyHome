import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string; // 主机地址
  port: number; // 端口号
  username: string; // 用户名
  password: string; // 密码
  database: string; // 数据库名称
}

/**
 * 数据库配置
 */
export default registerAs('database', (): DatabaseConfig => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'my_home_db',
  };
});
