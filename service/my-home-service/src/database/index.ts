import { TypeOrmModule } from '@nestjs/typeorm';
import baseConfig, { BaseConfig } from 'src/config/base.config';
import databaseConfig, { DatabaseConfig } from 'src/config/database.config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { addTransactionalDataSource, getDataSourceByName } from 'typeorm-transactional';

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

      // typeorm-transactional 按名称（默认 default）全局登记 DataSource，同名重复添加会抛错；
      // 而 @nestjs/typeorm 在连接失败时会多次重试并重复调用本工厂。
      // 因此已登记过就复用同一实例（Nest 会对它再次 initialize()，
      // 数据库恢复后无需重启进程即可自动连上），否则才注册新实例。
      return getDataSourceByName('default') ?? addTransactionalDataSource(new DataSource(options));
    },
  });
}
