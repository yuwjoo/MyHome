import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString } from 'class-validator';

/**
 * 分页查询参数
 */
export class PaginationQueryDto {
  @ApiProperty({
    description: '页码',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  pageNum: number = 1;

  @ApiProperty({
    description: '每页条数',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  pageSize: number = 30;

  @ApiProperty({
    description: '搜索关键词',
    example: '天气',
    required: false,
  })
  @IsOptional()
  @IsString()
  keywords?: string;
}
