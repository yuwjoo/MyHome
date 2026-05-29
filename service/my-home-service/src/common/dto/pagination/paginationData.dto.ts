import { ApiProperty } from '@nestjs/swagger';

/**
 * 分页数据结构
 */
export class PaginationDataDto<T = unknown> {
  @ApiProperty({
    description: '页码',
  })
  pageNum: number;

  @ApiProperty({
    description: '每页条数',
  })
  pageSize: number;

  @ApiProperty({
    description: '总条数',
  })
  total: number;

  @ApiProperty({
    description: '数据列表',
  })
  records: T[];
}
