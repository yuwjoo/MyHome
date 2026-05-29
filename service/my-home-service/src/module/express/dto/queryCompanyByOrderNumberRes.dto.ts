import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'express-QueryCompanyByOrderNumberResDto' })
export class QueryCompanyByOrderNumberResDto {
  @ApiProperty({
    description: '快递公司',
  })
  company: string; // 快递公司
}
