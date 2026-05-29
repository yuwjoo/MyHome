import { Module } from '@nestjs/common';
import { CloudDiskService } from './cloudDisk.service';
import { CloudDiskController } from './cloudDisk.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudDiskFileEntity } from './entities/cloudDiskFile.entity';
import { OssModule } from '../oss/oss.module';
import { UnitDao } from './dao/unit.dao';
import { FileDao } from './dao/file.dao';
import { DirectoryDao } from './dao/directory.dao';

@Module({
  imports: [TypeOrmModule.forFeature([CloudDiskFileEntity]), OssModule],
  controllers: [CloudDiskController],
  providers: [CloudDiskService, UnitDao, FileDao, DirectoryDao],
})
export class CloudDiskModule {}
