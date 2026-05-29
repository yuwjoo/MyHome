import { TypeOrmModule } from '@nestjs/typeorm';
import baseConfig, { BaseConfig } from 'src/config/base.config';
import databaseConfig, { DatabaseConfig } from 'src/config/database.config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { addTransactionalDataSource } from 'typeorm-transactional';

/**
 * 初始化数据库模块
 */
export function initDatabaseModule() {
  return TypeOrmModule.forRootAsync({
    inject: [baseConfig.KEY, databaseConfig.KEY],
    useFactory: (baseConfig: BaseConfig, dbConfig: DatabaseConfig) => {
      return {
        type: 'mysql',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        entities: [`${baseConfig.projectRoot}/**/*.entity{.ts,.js}`],
        synchronize: process.env.NODE_ENV === 'development', // 同步数据库结构
        logging: process.env.NODE_ENV === 'development', // 打印SQL日志
        namingStrategy: new SnakeNamingStrategy(), // 使用蛇形命名策略
      };
    },
    async dataSourceFactory(options) {
      if (!options) {
        throw new Error('Invalid options passed');
      }

      return addTransactionalDataSource(new DataSource(options));
    },
  });
}
