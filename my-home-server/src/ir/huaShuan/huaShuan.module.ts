import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HuaShuanController } from './huaShuan.controller';
import { HuaShuanService } from './huaShuan.service';
import { HuaShuan } from './huaShuan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HuaShuan])],
  controllers: [HuaShuanController],
  providers: [HuaShuanService],
})
export class HuaShuanModule {}