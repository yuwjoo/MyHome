import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'weather-GetExpressInfoResDto-MaterialRecord' })
export class MaterialRecord {
  @ApiProperty({
    description: '物流发生时间戳',
  })
  time: number; // 物流发生时间戳

  @ApiProperty({
    description: '物流描述',
  })
  desc: string; // 物流描述
}

@ApiSchema({ name: 'weather-GetExpressInfoResDto' })
export class GetExpressInfoResDto {
  @ApiProperty({
    description: '物流记录列表',
  })
  materialRecordList: MaterialRecord[]; // 物流记录列表

  @ApiProperty({
    description: '快递公司',
  })
  company: string; // 快递公司
}
