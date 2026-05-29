import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'express-QueryCompanyByOrderNumberDto' })
export class QueryCompanyByOrderNumberDto {
  @ApiProperty({
    description: '快递单号',
  })
  @IsString()
  orderNumber: string; // 快递单号
}
