import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // 配置全局api前缀
  app.setGlobalPrefix('api', {
    exclude: [],
  });

  // 配置全局校验管道，自动转换类型并验证数据
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 过滤掉未知属性
      forbidNonWhitelisted: false, // 当存在未知属性时抛出错误
    }),
  );

  // 配置CORS，允许跨域请求
  app.enableCors({
    origin: '*', // 在生产环境中应该配置具体的域名
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // 配置Swagger
  const config = new DocumentBuilder()
    .setTitle('MyHome API')
    .setDescription('家庭服务系统API文档')
    .setVersion('1.0')
    .addBearerAuth() // 添加Bearer认证
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.SERVER_PORT ?? 3000);
}
bootstrap();
