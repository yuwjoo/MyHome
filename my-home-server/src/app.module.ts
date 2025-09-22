import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HuaShuanModule } from './ir/huaShuan/huaShuan.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root', // 请根据您的实际MySQL用户名修改
      password: 'password', // 请根据您的实际MySQL密码修改
      database: 'my_home_server', // 请确保此数据库已创建或根据您的实际数据库名称修改
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 仅在开发环境使用，生产环境请设置为false
    }),
    HuaShuanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
