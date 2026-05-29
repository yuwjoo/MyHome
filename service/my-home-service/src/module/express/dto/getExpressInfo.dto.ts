import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'express-getExpressInfo' })
export class GetExpressInfoDto {
  @ApiProperty({
    description: '快递单号',
  })
  @IsString()
  orderNumber: string; // 快递单号

  @ApiProperty({
    description: '手机号',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string; // 手机号
}
