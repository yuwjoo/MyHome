import { Module } from '@nestjs/common';
import { OssService } from './oss.service';
import { OssController } from './oss.controller';
import { OssObjectDao } from './dao/ossObject.dao';
import { OssClientService } from './service/ossClient.service';
import { OssObjectEntity } from './entities/ossObject.entity';
import { OssObjectRefEntity } from './entities/ossObjectRef.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([OssObjectEntity, OssObjectRefEntity])],
  controllers: [OssController],
  providers: [OssService, OssObjectDao, OssClientService],
  exports: [OssService, OssClientService],
})
export class OssModule {}
