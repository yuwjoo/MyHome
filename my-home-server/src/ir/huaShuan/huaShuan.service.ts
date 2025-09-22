import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HuaShuan } from './huaShuan.entity';
import { HuaShuanDto } from './huaShuan.dto';

@Injectable()
export class HuaShuanService {
  constructor(
    @InjectRepository(HuaShuan)
    private huaShuanRepository: Repository<HuaShuan>,
  ) {}

  async updateState(huaShuanDto: HuaShuanDto): Promise<{ success: boolean; message: string }> {
    try {
      // 检查是否已存在记录
      const existingRecord = await this.huaShuanRepository.findOne({
        order: { requestTimestamp: 'DESC' },
      });

      // 如果存在记录且新记录的时间戳不大于已存在的记录，则不更新
      if (existingRecord && huaShuanDto.requestTimestamp <= existingRecord.requestTimestamp) {
        return {
          success: false,
          message: '已有更新的记录，无需更新',
        };
      }

      // 如果存在记录，则先删除旧记录
      if (existingRecord) {
        await this.huaShuanRepository.delete(existingRecord.id);
      }

      // 创建新记录
      const newRecord = this.huaShuanRepository.create({
        temperature: huaShuanDto.temperature,
        isCooling: huaShuanDto.isCooling,
        isHeating: huaShuanDto.isHeating,
        windSpeed: huaShuanDto.windSpeed,
        isSwinging: huaShuanDto.isSwinging,
        timerTimestamp: huaShuanDto.timerTimestamp,
        timerDuration: huaShuanDto.timerDuration,
        requestTimestamp: huaShuanDto.requestTimestamp,
      });

      // 保存新记录
      await this.huaShuanRepository.save(newRecord);

      return {
        success: true,
        message: '空调状态更新成功',
      };
    } catch (error) {
      console.error('更新空调状态时出错:', error);
      return {
        success: false,
        message: '更新失败，请稍后重试',
      };
    }
  }
}