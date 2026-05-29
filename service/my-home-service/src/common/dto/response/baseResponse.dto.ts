import { ApiProperty } from '@nestjs/swagger';
import { ResponseCode } from 'src/common/enum/response.enum';

/**
 * 基础响应结构
 */
export class BaseResponseDto<T = unknown> {
  @ApiProperty({
    description: '状态码',
  })
  code: ResponseCode;

  @ApiProperty({
    description: '响应数据',
  })
  data?: T;

  @ApiProperty({
    description: '响应消息',
  })
  message: string;
}
