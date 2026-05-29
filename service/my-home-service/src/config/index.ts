import { ConfigModule } from '@nestjs/config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import aliyunConfig from './aliyun.config';
import baseConfig from './base.config';

/**
 * 初始化配置模块
 */
export function initConfigModule() {
  return ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
    load: [baseConfig, databaseConfig, jwtConfig, aliyunConfig],
  });
}
