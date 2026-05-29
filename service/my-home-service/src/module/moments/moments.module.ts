import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MomentsController } from './moments.controller';
import { MomentsService } from './moments.service';
import { MomentsPostEntity } from './entities/momentsPost.entity';
import { MomentsCommentEntity } from './entities/momentsComment.entity';
import { SysUserEntity } from '../system/module/auth/entities/sysUser.entity';
import { OssModule } from '../oss/oss.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MomentsPostEntity,
      MomentsCommentEntity,
      SysUserEntity,
    ]),
    OssModule,
  ],
  controllers: [MomentsController],
  providers: [MomentsService],
})
export class MomentsModule {}
